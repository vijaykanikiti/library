package com.library.service;

import com.library.entity.Fine;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.repository.BookRepo;
import com.library.repository.FineRepo;
import com.library.repository.LoanRepo;
import com.library.repository.UserRepo;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ReportService {

  private final LoanRepo loanRepo;
  private final BookRepo bookRepo;
  private final UserRepo userRepo;
  private final FineRepo fineRepo;

  public ReportService(LoanRepo loanRepo, BookRepo bookRepo, UserRepo userRepo, FineRepo fineRepo) {
    this.loanRepo = loanRepo;
    this.bookRepo = bookRepo;
    this.userRepo = userRepo;
    this.fineRepo = fineRepo;
  }

  public Map<String, Object> getDashboardStats() {
    Map<String, Object> stats = new HashMap<>();

    long totalBooks = bookRepo.count();
    Long totalCopies = bookRepo.sumTotalCopies();
    Long availableCopies = bookRepo.sumAvailableCopies();

    long totalUsers = userRepo.count();
    long totalStudents = userRepo.countByRole(User.Role.STUDENT);
    long totalLibrarians = userRepo.countByRole(User.Role.LIBRARIAN);

    long activeLoans = loanRepo.countByStatus(Loan.Status.ACTIVE);
    long overdueLoans = loanRepo.countByStatus(Loan.Status.OVERDUE);
    long returnedLoans = loanRepo.countByStatus(Loan.Status.RETURNED);

    BigDecimal unpaidFines = fineRepo.sumAmountByStatus(Fine.Status.UNPAID);
    BigDecimal paidFines = fineRepo.sumAmountByStatus(Fine.Status.PAID);

    stats.put("totalBooks", totalBooks);
    stats.put("totalCopies", totalCopies != null ? totalCopies : 0);
    stats.put("availableCopies", availableCopies != null ? availableCopies : 0);
    stats.put("totalUsers", totalUsers);
    stats.put("totalStudents", totalStudents);
    stats.put("totalLibrarians", totalLibrarians);
    stats.put("activeLoans", activeLoans);
    stats.put("overdueLoans", overdueLoans);
    stats.put("returnedLoans", returnedLoans);
    stats.put("unpaidFines", unpaidFines != null ? unpaidFines : BigDecimal.ZERO);
    stats.put("paidFines", paidFines != null ? paidFines : BigDecimal.ZERO);

    return stats;
  }

  public List<Loan> getIssuedReport(LocalDate startDate, LocalDate endDate) {
    LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(30)).atStartOfDay();
    LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(LocalTime.MAX);
    return loanRepo.findIssuedBetween(start, end);
  }

  public List<Loan> getReturnedReport(LocalDate startDate, LocalDate endDate) {
    LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(30)).atStartOfDay();
    LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(LocalTime.MAX);
    return loanRepo.findReturnedBetween(start, end);
  }

  public List<Loan> getOverdueLoans() {
    return loanRepo.findByStatusAndDueDateBefore(Loan.Status.ACTIVE, LocalDateTime.now());
  }

  public List<Map<String, Object>> getPopularBooks(int limit) {
    List<Object[]> rows = loanRepo.findPopularBooks(PageRequest.of(0, limit > 0 ? limit : 10));
    List<Map<String, Object>> result = new ArrayList<>();
    for (Object[] row : rows) {
      Map<String, Object> map = new HashMap<>();
      map.put("bookId", row[0]);
      map.put("title", row[1]);
      map.put("author", row[2]);
      map.put("loanCount", row[3]);
      result.add(map);
    }
    return result;
  }

  public Map<String, Object> getFineSummary(LocalDate startDate, LocalDate endDate) {
    LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(30)).atStartOfDay();
    LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(LocalTime.MAX);

    List<Fine> paidList = fineRepo.findPaidBetween(start, end);
    BigDecimal periodCollected = BigDecimal.ZERO;
    for (Fine f : paidList) {
      periodCollected = periodCollected.add(f.getAmount());
    }

    BigDecimal allTimeUnpaid = fineRepo.sumAmountByStatus(Fine.Status.UNPAID);
    BigDecimal allTimePaid = fineRepo.sumAmountByStatus(Fine.Status.PAID);

    Map<String, Object> summary = new HashMap<>();
    summary.put("periodCollected", periodCollected);
    summary.put("allTimePaid", allTimePaid != null ? allTimePaid : BigDecimal.ZERO);
    summary.put("allTimeUnpaid", allTimeUnpaid != null ? allTimeUnpaid : BigDecimal.ZERO);
    summary.put("payments", paidList);
    return summary;
  }
}
