package com.library.controller;

import com.library.entity.Loan;
import com.library.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

  private final ReportService reportService;

  public ReportController(ReportService reportService) {
    this.reportService = reportService;
  }

  @GetMapping("/dashboard")
  public ResponseEntity<Map<String, Object>> getDashboardStats() {
    return ResponseEntity.ok(reportService.getDashboardStats());
  }

  @GetMapping("/issued")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<List<Loan>> getIssuedReport(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    return ResponseEntity.ok(reportService.getIssuedReport(startDate, endDate));
  }

  @GetMapping("/returned")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<List<Loan>> getReturnedReport(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    return ResponseEntity.ok(reportService.getReturnedReport(startDate, endDate));
  }

  @GetMapping("/overdue")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<List<Loan>> getOverdueLoans() {
    return ResponseEntity.ok(reportService.getOverdueLoans());
  }

  @GetMapping("/popular")
  public ResponseEntity<List<Map<String, Object>>> getPopularBooks(
      @RequestParam(defaultValue = "10") int limit
  ) {
    return ResponseEntity.ok(reportService.getPopularBooks(limit));
  }

  @GetMapping("/fines")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Map<String, Object>> getFineSummary(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    return ResponseEntity.ok(reportService.getFineSummary(startDate, endDate));
  }
}
