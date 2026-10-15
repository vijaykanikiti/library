package com.library.service;

import com.library.dto.PaymentRequest;
import com.library.entity.Fine;
import com.library.entity.Loan;
import com.library.entity.Notice;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.FineRepo;
import com.library.repository.LibrarySettingRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class FineService {

  private final FineRepo fineRepo;
  private final LibrarySettingRepo settingRepo;
  private final NoticeService noticeService;

  public FineService(FineRepo fineRepo, LibrarySettingRepo settingRepo, NoticeService noticeService) {
    this.fineRepo = fineRepo;
    this.settingRepo = settingRepo;
    this.noticeService = noticeService;
  }

  public Page<Fine> getFines(Fine.Status status, Long userId, Pageable pageable) {
    return fineRepo.filterFines(status, userId, pageable);
  }

  public List<Fine> getUserFines(Long userId) {
    return fineRepo.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public Optional<Fine> getFineByLoan(Long loanId) {
    return fineRepo.findByLoanId(loanId);
  }

  @Transactional
  public Fine calculateAndApplyFine(Loan loan, LocalDateTime calculationDate) {
    LocalDate dueDate = loan.getDueDate().toLocalDate();
    LocalDate targetDate = calculationDate.toLocalDate();

    long daysOverdue = ChronoUnit.DAYS.between(dueDate, targetDate);

    long graceDays = getSettingLong("grace_period_days", 1L);
    if (daysOverdue <= graceDays) {
      return null;
    }

    BigDecimal fineRate = getSettingBigDecimal("fine_rate_per_day", new BigDecimal("5.00"));
    BigDecimal maxFine = getSettingBigDecimal("max_fine_per_loan", new BigDecimal("200.00"));

    BigDecimal calculatedAmount = fineRate.multiply(BigDecimal.valueOf(daysOverdue)).setScale(2, RoundingMode.HALF_UP);
    if (calculatedAmount.compareTo(maxFine) > 0) {
      calculatedAmount = maxFine;
    }

    Optional<Fine> existingOpt = fineRepo.findByLoanId(loan.getId());
    Fine fine;
    if (existingOpt.isPresent()) {
      fine = existingOpt.get();
      if (fine.getStatus() == Fine.Status.PAID) {
        return fine;
      }
      fine.setAmount(calculatedAmount);
    } else {
      fine = new Fine();
      fine.setLoan(loan);
      fine.setUser(loan.getUser());
      fine.setAmount(calculatedAmount);
      fine.setStatus(Fine.Status.UNPAID);
    }

    fine.setNotes("Overdue fine: " + daysOverdue + " day(s) at " + fineRate + " per day");
    Fine saved = fineRepo.save(fine);

    noticeService.sendNotice(
        loan.getUser(),
        "Fine Incurred",
        "A fine of " + saved.getAmount() + " was assessed for overdue book '" + loan.getBook().getTitle() + "'.",
        Notice.Type.WARNING
    );

    return saved;
  }

  @Transactional
  public Fine recordPayment(Long fineId, PaymentRequest req) {
    Fine fine = fineRepo.findById(fineId)
        .orElseThrow(() -> new NotFound("Fine record not found with ID: " + fineId));

    if (fine.getStatus() == Fine.Status.PAID) {
      throw new BadRequest("This fine has already been marked as PAID on " + fine.getPaidDate() + ".");
    }

    fine.setStatus(Fine.Status.PAID);
    fine.setPaidDate(LocalDateTime.now());
    fine.setPaymentMethod(req.getPaymentMethod().trim().toUpperCase());
    fine.setPaymentReference(req.getPaymentReference() != null ? req.getPaymentReference().trim() : "REF-" + System.currentTimeMillis());
    if (req.getNotes() != null) {
      fine.setNotes(fine.getNotes() != null ? fine.getNotes() + " | " + req.getNotes() : req.getNotes());
    }

    Fine saved = fineRepo.save(fine);

    noticeService.sendNotice(
        fine.getUser(),
        "Fine Payment Received",
        "Payment of " + fine.getAmount() + " received for fine #" + fine.getId() + " via " + fine.getPaymentMethod() + ".",
        Notice.Type.SUCCESS
    );

    return saved;
  }

  private long getSettingLong(String key, long defaultValue) {
    return settingRepo.findBySettingKey(key)
        .map(s -> {
          try { return Long.parseLong(s.getSettingValue()); } catch (Exception e) { return defaultValue; }
        })
        .orElse(defaultValue);
  }

  private BigDecimal getSettingBigDecimal(String key, BigDecimal defaultValue) {
    return settingRepo.findBySettingKey(key)
        .map(s -> {
          try { return new BigDecimal(s.getSettingValue()); } catch (Exception e) { return defaultValue; }
        })
        .orElse(defaultValue);
  }
}
