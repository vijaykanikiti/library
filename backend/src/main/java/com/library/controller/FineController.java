package com.library.controller;

import com.library.dto.PaymentRequest;
import com.library.entity.Fine;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.FineService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
public class FineController {

  private final FineService fineService;
  private final AuthService authService;

  public FineController(FineService fineService, AuthService authService) {
    this.fineService = fineService;
    this.authService = authService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Page<Fine>> getFines(
      @RequestParam(required = false) Fine.Status status,
      @RequestParam(required = false) Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
    Page<Fine> fines = fineService.getFines(status, userId, pageable);
    return ResponseEntity.ok(fines);
  }

  @GetMapping("/my")
  public ResponseEntity<List<Fine>> getMyFines(Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    List<Fine> fines = fineService.getUserFines(user.getId());
    return ResponseEntity.ok(fines);
  }

  @PostMapping("/{id}/record-payment")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Fine> recordPayment(
      @PathVariable Long id,
      @Valid @RequestBody PaymentRequest req
  ) {
    Fine paid = fineService.recordPayment(id, req);
    return ResponseEntity.ok(paid);
  }
}
