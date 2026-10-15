package com.library.service;

import com.library.dto.IssueRequest;
import com.library.entity.*;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.BookRepo;
import com.library.repository.LibrarySettingRepo;
import com.library.repository.LoanRepo;
import com.library.repository.ReserveRepo;
import com.library.repository.UserRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class LoanService {

  private final LoanRepo loanRepo;
  private final BookRepo bookRepo;
  private final UserRepo userRepo;
  private final ReserveRepo reserveRepo;
  private final LibrarySettingRepo settingRepo;
  private final FineService fineService;
  private final ReserveService reserveService;
  private final NoticeService noticeService;
  private final MailService mailService;

  public LoanService(
      LoanRepo loanRepo,
      BookRepo bookRepo,
      UserRepo userRepo,
      ReserveRepo reserveRepo,
      LibrarySettingRepo settingRepo,
      FineService fineService,
      ReserveService reserveService,
      NoticeService noticeService,
      MailService mailService
  ) {
    this.loanRepo = loanRepo;
    this.bookRepo = bookRepo;
    this.userRepo = userRepo;
    this.reserveRepo = reserveRepo;
    this.settingRepo = settingRepo;
    this.fineService = fineService;
    this.reserveService = reserveService;
    this.noticeService = noticeService;
    this.mailService = mailService;
  }

  public Page<Loan> getLoans(Loan.Status status, Long userId, Long bookId, String query, Pageable pageable) {
    return loanRepo.filterLoans(status, userId, bookId, query, pageable);
  }

  public Page<Loan> getUserLoans(Long userId, Pageable pageable) {
    return loanRepo.findByUserIdOrderByIssueDateDesc(userId, pageable);
  }

  public List<Loan> getUserActiveLoans(Long userId) {
    return loanRepo.findByUserIdAndStatusInOrderByIssueDateDesc(userId, Arrays.asList(Loan.Status.ACTIVE, Loan.Status.OVERDUE));
  }

  public Loan getLoanById(Long id) {
    return loanRepo.findById(id)
        .orElseThrow(() -> new NotFound("Loan record not found with ID: " + id));
  }

  @Transactional
  public Loan issueBook(IssueRequest req, User issuer) {
    Book book = bookRepo.findById(req.getBookId())
        .orElseThrow(() -> new NotFound("Book not found with ID: " + req.getBookId()));

    User member = userRepo.findById(req.getUserId())
        .orElseThrow(() -> new NotFound("Member not found with ID: " + req.getUserId()));

    if (!member.getActive()) {
      throw new BadRequest("Cannot issue book: Member account is deactivated.");
    }

    // Check if member has an AVAILABLE reservation for this book
    Optional<Reserve> memberReserve = reserveRepo.findFirstByBookIdAndStatusOrderByQueueOrderAsc(book.getId(), Reserve.Status.AVAILABLE)
        .filter(r -> r.getUser().getId().equals(member.getId()));

    if (book.getAvailableCopies() <= 0 && memberReserve.isEmpty()) {
      throw new BadRequest("No available copies of '" + book.getTitle() + "' to borrow.");
    }

    // Check borrowing limit
    int loanLimit = getSettingInt("loan_limit_count", 3);
    long activeCount = loanRepo.countByUserIdAndStatusIn(member.getId(), Arrays.asList(Loan.Status.ACTIVE, Loan.Status.OVERDUE));
    if (activeCount >= loanLimit) {
      throw new BadRequest("Member has reached maximum borrowing limit of " + loanLimit + " books.");
    }

    // If not fulfilling an available reservation, decrease stock
    if (memberReserve.isEmpty()) {
      book.setAvailableCopies(book.getAvailableCopies() - 1);
      bookRepo.save(book);
    } else {
      // Complete reservation
      Reserve r = memberReserve.get();
      r.setStatus(Reserve.Status.COMPLETED);
      reserveRepo.save(r);
    }

    int borrowDays = req.getDueDays() != null && req.getDueDays() > 0 ?
        req.getDueDays() : getSettingInt("borrowing_period_days", 14);

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime due = now.plusDays(borrowDays);

    Loan loan = new Loan();
    loan.setBook(book);
    loan.setUser(member);
    loan.setIssuedBy(issuer);
    loan.setIssueDate(now);
    loan.setDueDate(due);
    loan.setStatus(Loan.Status.ACTIVE);
    loan.setRenewalCount(0);

    Loan saved = loanRepo.save(loan);

    String message = "Book '" + book.getTitle() + "' has been issued to you. Due date: " + due.toLocalDate() + ".";
    noticeService.sendNotice(member, "Book Issued", message, Notice.Type.SUCCESS);
    mailService.sendNotificationEmail(member.getEmail(), "Book Issued: " + book.getTitle(), message);

    return saved;
  }

  @Transactional
  public Loan returnBook(Long loanId, User returningStaff) {
    Loan loan = getLoanById(loanId);

    if (loan.getStatus() == Loan.Status.RETURNED) {
      throw new BadRequest("This book loan has already been marked as RETURNED on " + loan.getReturnDate() + ".");
    }

    LocalDateTime returnTime = LocalDateTime.now();
    loan.setReturnDate(returnTime);
    loan.setStatus(Loan.Status.RETURNED);

    // Check overdue fines
    if (returnTime.isAfter(loan.getDueDate())) {
      fineService.calculateAndApplyFine(loan, returnTime);
    }

    Loan saved = loanRepo.save(loan);

    // Handle book stock: either give to next FIFO reservation or increment available copies
    reserveService.processNextInQueue(loan.getBook());

    String message = "Book '" + loan.getBook().getTitle() + "' was successfully returned on " + returnTime.toLocalDate() + ".";
    noticeService.sendNotice(loan.getUser(), "Book Returned Successfully", message, Notice.Type.SUCCESS);

    return saved;
  }

  @Transactional
  public Loan renewBook(Long loanId, User currentUser) {
    Loan loan = getLoanById(loanId);

    if (loan.getStatus() != Loan.Status.ACTIVE && loan.getStatus() != Loan.Status.OVERDUE) {
      throw new BadRequest("Only active loans can be renewed.");
    }

    // Students can only renew their own loans
    if (currentUser.getRole() == User.Role.STUDENT && !loan.getUser().getId().equals(currentUser.getId())) {
      throw new BadRequest("You can only renew your own borrowed books.");
    }

    int maxRenewals = getSettingInt("max_renewals", 2);
    if (loan.getRenewalCount() >= maxRenewals) {
      throw new BadRequest("This book has reached the maximum allowed renewals (" + maxRenewals + "). Please return it.");
    }

    // Check if there are other students waiting in reservation queue
    boolean hasWaitingReservations = reserveRepo.existsByBookIdAndUserIdAndStatusIn(
        loan.getBook().getId(),
        null,
        Arrays.asList(Reserve.Status.PENDING)
    );
    // Better check: are any students waiting for this book?
    List<Reserve> waiting = reserveRepo.findByBookIdAndStatusOrderByQueueOrderAsc(loan.getBook().getId(), Reserve.Status.PENDING);
    if (!waiting.isEmpty()) {
      throw new BadRequest("Renewal cannot be approved because another student is currently waiting in the reservation queue for this book.");
    }

    int borrowDays = getSettingInt("borrowing_period_days", 14);
    loan.setDueDate(loan.getDueDate().plusDays(borrowDays));
    loan.setRenewalCount(loan.getRenewalCount() + 1);
    loan.setStatus(Loan.Status.ACTIVE);

    Loan saved = loanRepo.save(loan);

    String message = "Loan for '" + loan.getBook().getTitle() + "' renewed. New due date is " + loan.getDueDate().toLocalDate() + ".";
    noticeService.sendNotice(loan.getUser(), "Loan Renewed", message, Notice.Type.SUCCESS);

    return saved;
  }

  @Transactional
  public void checkAndAlertOverdueLoans() {
    LocalDateTime now = LocalDateTime.now();
    List<Loan> overdueLoans = loanRepo.findByStatusAndDueDateBefore(Loan.Status.ACTIVE, now);

    for (Loan loan : overdueLoans) {
      loan.setStatus(Loan.Status.OVERDUE);
      loanRepo.save(loan);

      fineService.calculateAndApplyFine(loan, now);

      String msg = "Reminder: Your borrowed book '" + loan.getBook().getTitle() + "' was due on " + loan.getDueDate().toLocalDate() + " and is now overdue. Please return it promptly.";
      noticeService.sendNotice(loan.getUser(), "Overdue Book Alert", msg, Notice.Type.ALERT);
      mailService.sendNotificationEmail(loan.getUser().getEmail(), "Overdue Notice: " + loan.getBook().getTitle(), msg);
    }
  }

  private int getSettingInt(String key, int defaultValue) {
    return settingRepo.findBySettingKey(key)
        .map(s -> {
          try { return Integer.parseInt(s.getSettingValue()); } catch (Exception e) { return defaultValue; }
        })
        .orElse(defaultValue);
  }
}
