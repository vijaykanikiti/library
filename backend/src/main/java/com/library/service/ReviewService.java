package com.library.service;

import com.library.dto.ReviewRequest;
import com.library.entity.Book;
import com.library.entity.Review;
import com.library.entity.User;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.BookRepo;
import com.library.repository.ReviewRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewService {

  private final ReviewRepo reviewRepo;
  private final BookRepo bookRepo;

  public ReviewService(ReviewRepo reviewRepo, BookRepo bookRepo) {
    this.reviewRepo = reviewRepo;
    this.bookRepo = bookRepo;
  }

  public List<Review> getBookReviews(Long bookId) {
    return reviewRepo.findByBookIdOrderByCreatedAtDesc(bookId);
  }

  public Map<String, Object> getBookRatingSummary(Long bookId) {
    Double avg = reviewRepo.findAverageRatingByBookId(bookId);
    long count = reviewRepo.countByBookId(bookId);

    Map<String, Object> summary = new HashMap<>();
    summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
    summary.put("reviewCount", count);
    return summary;
  }

  @Transactional
  public Review saveOrUpdateReview(Long bookId, User user, ReviewRequest req) {
    Book book = bookRepo.findById(bookId)
        .orElseThrow(() -> new NotFound("Book not found with ID: " + bookId));

    if (req.getRating() < 1 || req.getRating() > 5) {
      throw new BadRequest("Rating must be between 1 and 5 stars.");
    }

    Optional<Review> existingOpt = reviewRepo.findByBookIdAndUserId(bookId, user.getId());
    Review review;
    if (existingOpt.isPresent()) {
      review = existingOpt.get();
      review.setRating(req.getRating());
      review.setComment(req.getComment() != null ? req.getComment().trim() : null);
    } else {
      review = new Review();
      review.setBook(book);
      review.setUser(user);
      review.setRating(req.getRating());
      review.setComment(req.getComment() != null ? req.getComment().trim() : null);
    }

    return reviewRepo.save(review);
  }

  @Transactional
  public void deleteReview(Long reviewId, User currentUser) {
    Review review = reviewRepo.findById(reviewId)
        .orElseThrow(() -> new NotFound("Review not found with ID: " + reviewId));

    // Allow deletion if owner or ADMIN
    if (currentUser.getRole() != User.Role.ADMIN && !review.getUser().getId().equals(currentUser.getId())) {
      throw new BadRequest("You do not have permission to delete this review.");
    }

    reviewRepo.delete(review);
  }

  public Page<Review> getAllReviews(Pageable pageable) {
    return reviewRepo.findAllByOrderByCreatedAtDesc(pageable);
  }
}
