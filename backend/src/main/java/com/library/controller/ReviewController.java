package com.library.controller;

import com.library.dto.ReviewRequest;
import com.library.entity.Review;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class ReviewController {

  private final ReviewService reviewService;
  private final AuthService authService;

  public ReviewController(ReviewService reviewService, AuthService authService) {
    this.reviewService = reviewService;
    this.authService = authService;
  }

  @GetMapping("/api/books/{bookId}/reviews")
  public ResponseEntity<Map<String, Object>> getBookReviews(@PathVariable Long bookId) {
    List<Review> reviews = reviewService.getBookReviews(bookId);
    Map<String, Object> summary = reviewService.getBookRatingSummary(bookId);

    Map<String, Object> res = new HashMap<>();
    res.put("reviews", reviews);
    res.put("summary", summary);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/api/books/{bookId}/reviews")
  public ResponseEntity<Review> createOrUpdateBookReview(
      @PathVariable Long bookId,
      @Valid @RequestBody ReviewRequest req,
      Authentication auth
  ) {
    User user = authService.getCurrentUser(auth.getName());
    Review review = reviewService.saveOrUpdateReview(bookId, user, req);
    return ResponseEntity.status(HttpStatus.CREATED).body(review);
  }

  @PutMapping("/api/reviews/{id}")
  public ResponseEntity<Review> updateReview(
      @PathVariable Long id,
      @Valid @RequestBody ReviewRequest req,
      Authentication auth
  ) {
    User user = authService.getCurrentUser(auth.getName());
    Review updated = reviewService.saveOrUpdateReview(id, user, req);
    return ResponseEntity.ok(updated);
  }

  @DeleteMapping("/api/reviews/{id}")
  public ResponseEntity<Map<String, String>> deleteReview(
      @PathVariable Long id,
      Authentication auth
  ) {
    User user = authService.getCurrentUser(auth.getName());
    reviewService.deleteReview(id, user);

    Map<String, String> res = new HashMap<>();
    res.put("message", "Review deleted successfully.");
    return ResponseEntity.ok(res);
  }
}
