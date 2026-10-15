package com.library.controller;

import com.library.dto.IssueRequest;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

  private final LoanService loanService;
  private final AuthService authService;

  public LoanController(LoanService loanService, AuthService authService) {
    this.loanService = loanService;
    this.authService = authService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Page<Loan>> getLoans(
      @RequestParam(required = false) Loan.Status status,
      @RequestParam(required = false) Long userId,
      @RequestParam(required = false) Long bookId,
      @RequestParam(required = false) String query,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
    Page<Loan> loans = loanService.getLoans(status, userId, bookId, query, pageable);
    return ResponseEntity.ok(loans);
  }

  @GetMapping("/history")
  public ResponseEntity<Page<Loan>> getLoanHistory(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      Authentication auth
  ) {
    User user = authService.getCurrentUser(auth.getName());
    Pageable pageable = PageRequest.of(page, size);
    Page<Loan> loans = loanService.getUserLoans(user.getId(), pageable);
    return ResponseEntity.ok(loans);
  }

  @GetMapping("/my-active")
  public ResponseEntity<List<Loan>> getMyActiveLoans(Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    List<Loan> active = loanService.getUserActiveLoans(user.getId());
    return ResponseEntity.ok(active);
  }

  @PostMapping("/issue")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Loan> issueBook(@Valid @RequestBody IssueRequest req, Authentication auth) {
    User issuer = authService.getCurrentUser(auth.getName());
    Loan loan = loanService.issueBook(req, issuer);
    return ResponseEntity.status(HttpStatus.CREATED).body(loan);
  }

  @PostMapping("/{id}/return")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Loan> returnBook(@PathVariable Long id, Authentication auth) {
    User staff = authService.getCurrentUser(auth.getName());
    Loan loan = loanService.returnBook(id, staff);
    return ResponseEntity.ok(loan);
  }

  @PostMapping("/{id}/renew")
  public ResponseEntity<Loan> renewBook(@PathVariable Long id, Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    Loan renewed = loanService.renewBook(id, user);
    return ResponseEntity.ok(renewed);
  }
}
