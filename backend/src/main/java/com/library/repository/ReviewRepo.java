package com.library.repository;

import com.library.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepo extends JpaRepository<Review, Long> {

  List<Review> findByBookIdOrderByCreatedAtDesc(Long bookId);

  Optional<Review> findByBookIdAndUserId(Long bookId, Long userId);

  boolean existsByBookIdAndUserId(Long bookId, Long userId);

  long countByBookId(Long bookId);

  @Query("SELECT AVG(CAST(r.rating as double)) FROM Review r WHERE r.book.id = :bookId")
  Double findAverageRatingByBookId(@Param("bookId") Long bookId);

  Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
