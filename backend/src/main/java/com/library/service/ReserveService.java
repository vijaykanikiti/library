package com.library.service;

import com.library.entity.Book;
import com.library.entity.Notice;
import com.library.entity.Reserve;
import com.library.entity.User;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.BookRepo;
import com.library.repository.LibrarySettingRepo;
import com.library.repository.ReserveRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ReserveService {

  private final ReserveRepo reserveRepo;
  private final BookRepo bookRepo;
  private final LibrarySettingRepo settingRepo;
  private final NoticeService noticeService;
  private final MailService mailService;

  public ReserveService(
      ReserveRepo reserveRepo,
      BookRepo bookRepo,
      LibrarySettingRepo settingRepo,
      NoticeService noticeService,
      MailService mailService
  ) {
    this.reserveRepo = reserveRepo;
    this.bookRepo = bookRepo;
    this.settingRepo = settingRepo;
    this.noticeService = noticeService;
    this.mailService = mailService;
  }

  public Page<Reserve> getReservations(Reserve.Status status, Long bookId, Long userId, Pageable pageable) {
    return reserveRepo.filterReservations(status, bookId, userId, pageable);
  }

  public List<Reserve> getUserReservations(Long userId) {
    return reserveRepo.findByUserIdOrderByReserveDateDesc(userId);
  }

  @Transactional
  public Reserve reserveBook(User user, Long bookId) {
    Book book = bookRepo.findById(bookId)
        .orElseThrow(() -> new NotFound("Book not found with ID: " + bookId));

    if (book.getAvailableCopies() > 0) {
      throw new BadRequest("Book is currently in stock (" + book.getAvailableCopies() + " available). You can borrow it directly without reserving.");
    }

    boolean alreadyReserved = reserveRepo.existsByBookIdAndUserIdAndStatusIn(
        bookId,
        user.getId(),
        Arrays.asList(Reserve.Status.PENDING, Reserve.Status.AVAILABLE)
    );
    if (alreadyReserved) {
      throw new BadRequest("You already have an active reservation for this book.");
    }

    int nextQueue = reserveRepo.findMaxQueueOrder(bookId, Reserve.Status.PENDING) + 1;

    Reserve reserve = new Reserve();
    reserve.setBook(book);
    reserve.setUser(user);
    reserve.setReserveDate(LocalDateTime.now());
    reserve.setStatus(Reserve.Status.PENDING);
    reserve.setQueueOrder(nextQueue);

    Reserve saved = reserveRepo.save(reserve);

    noticeService.sendNotice(
        user,
        "Reservation Placed",
        "You have reserved '" + book.getTitle() + "'. You are #" + nextQueue + " in the waiting queue.",
        Notice.Type.INFO
    );

    return saved;
  }

  @Transactional
  public Reserve cancelReservation(Long reserveId, User currentUser) {
    Reserve reserve = reserveRepo.findById(reserveId)
        .orElseThrow(() -> new NotFound("Reservation not found with ID: " + reserveId));

    // Check permission: Student can only cancel their own; Admin/Librarian can cancel any
    if (currentUser.getRole() == User.Role.STUDENT && !reserve.getUser().getId().equals(currentUser.getId())) {
      throw new BadRequest("You can only cancel your own reservations.");
    }

    if (reserve.getStatus() != Reserve.Status.PENDING && reserve.getStatus() != Reserve.Status.AVAILABLE) {
      throw new BadRequest("Only PENDING or AVAILABLE reservations can be cancelled.");
    }

    boolean wasAvailable = reserve.getStatus() == Reserve.Status.AVAILABLE;
    reserve.setStatus(Reserve.Status.CANCELLED);
    Reserve saved = reserveRepo.save(reserve);

    noticeService.sendNotice(
        reserve.getUser(),
        "Reservation Cancelled",
        "Your reservation for '" + reserve.getBook().getTitle() + "' has been cancelled.",
        Notice.Type.INFO
    );

    // If the cancelled reservation was holding an available copy, allocate it to next FIFO reservation or restore stock
    if (wasAvailable) {
      processNextInQueue(reserve.getBook());
    }

    return saved;
  }

  @Transactional
  public void processNextInQueue(Book book) {
    // Expire any outdated AVAILABLE reservations first
    checkAndExpireReservations();

    Optional<Reserve> nextReserve = reserveRepo.findFirstByBookIdAndStatusOrderByQueueOrderAsc(book.getId(), Reserve.Status.PENDING);
    if (nextReserve.isPresent()) {
      Reserve r = nextReserve.get();
      r.setStatus(Reserve.Status.AVAILABLE);

      int pickupHours = getSettingInt("pickup_expiry_hours", 48);
      LocalDateTime expiry = LocalDateTime.now().plusHours(pickupHours);
      r.setExpiryDate(expiry);
      reserveRepo.save(r);

      String message = "Good news! Your reserved book '" + book.getTitle() + "' is now ready for pickup. Please collect it before " + expiry.toLocalDate() + " " + expiry.toLocalTime().withNano(0) + ".";
      noticeService.sendNotice(r.getUser(), "Reserved Book Available!", message, Notice.Type.SUCCESS);
      mailService.sendNotificationEmail(r.getUser().getEmail(), "Reserved Book Ready for Pickup: " + book.getTitle(), message);
    } else {
      // No one is waiting, increase book stock
      book.setAvailableCopies(Math.min(book.getAvailableCopies() + 1, book.getTotalCopies()));
      bookRepo.save(book);
    }
  }

  @Transactional
  public void checkAndExpireReservations() {
    List<Reserve> expired = reserveRepo.findByStatusAndExpiryDateBefore(Reserve.Status.AVAILABLE, LocalDateTime.now());
    for (Reserve r : expired) {
      r.setStatus(Reserve.Status.EXPIRED);
      reserveRepo.save(r);

      noticeService.sendNotice(
          r.getUser(),
          "Reservation Expired",
          "Your pickup window for '" + r.getBook().getTitle() + "' has expired.",
          Notice.Type.WARNING
      );

      // Pass on to next in FIFO queue or restore book copy
      processNextInQueue(r.getBook());
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
