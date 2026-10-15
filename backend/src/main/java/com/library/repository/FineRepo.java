package com.library.repository;

import com.library.entity.Fine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepo extends JpaRepository<Fine, Long> {

  Optional<Fine> findByLoanId(Long loanId);

  boolean existsByLoanId(Long loanId);

  List<Fine> findByUserIdOrderByCreatedAtDesc(Long userId);

  Page<Fine> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

  @Query("SELECT r FROM Fine r WHERE " +
      "(:status IS NULL OR r.status = :status) AND " +
      "(:userId IS NULL OR r.user.id = :userId)")
  Page<Fine> filterFines(
      @Param("status") Fine.Status status,
      @Param("userId") Long userId,
      Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.status = :status")
  BigDecimal sumAmountByStatus(@Param("status") Fine.Status status);

  @Query("SELECT f FROM Fine f WHERE f.paidDate BETWEEN :start AND :end AND f.status = 'PAID'")
  List<Fine> findPaidBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
