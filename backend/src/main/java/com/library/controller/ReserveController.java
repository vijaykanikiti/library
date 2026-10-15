package com.library.controller;

import com.library.dto.ReserveRequest;
import com.library.entity.Reserve;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.ReserveService;
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
@RequestMapping("/api/reservations")
public class ReserveController {

  private final ReserveService reserveService;
  private final AuthService authService;

  public ReserveController(ReserveService reserveService, AuthService authService) {
    this.reserveService = reserveService;
    this.authService = authService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Page<Reserve>> getReservations(
      @RequestParam(required = false) Reserve.Status status,
      @RequestParam(required = false) Long bookId,
      @RequestParam(required = false) Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
    Page<Reserve> reserves = reserveService.getReservations(status, bookId, userId, pageable);
    return ResponseEntity.ok(reserves);
  }

  @GetMapping("/my")
  public ResponseEntity<List<Reserve>> getMyReservations(Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    List<Reserve> list = reserveService.getUserReservations(user.getId());
    return ResponseEntity.ok(list);
  }

  @PostMapping
  public ResponseEntity<Reserve> reserveBook(@Valid @RequestBody ReserveRequest req, Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    Reserve reserve = reserveService.reserveBook(user, req.getBookId());
    return ResponseEntity.status(HttpStatus.CREATED).body(reserve);
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<Reserve> cancelReservation(@PathVariable Long id, Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    Reserve cancelled = reserveService.cancelReservation(id, user);
    return ResponseEntity.ok(cancelled);
  }
}
