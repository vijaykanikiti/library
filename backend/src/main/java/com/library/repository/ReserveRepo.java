package com.library.repository;

import com.library.entity.Reserve;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReserveRepo extends JpaRepository<Reserve, Long> {

  boolean existsByBookIdAndUserIdAndStatusIn(Long bookId, Long userId, Collection<Reserve.Status> statuses);

  List<Reserve> findByUserIdOrderByReserveDateDesc(Long userId);

  Page<Reserve> findByUserIdOrderByReserveDateDesc(Long userId, Pageable pageable);

  List<Reserve> findByBookIdAndStatusOrderByQueueOrderAsc(Long bookId, Reserve.Status status);

  Optional<Reserve> findFirstByBookIdAndStatusOrderByQueueOrderAsc(Long bookId, Reserve.Status status);

  @Query("SELECT COALESCE(MAX(r.queueOrder), 0) FROM Reserve r WHERE r.book.id = :bookId AND r.status = :status")
  Integer findMaxQueueOrder(@Param("bookId") Long bookId, @Param("status") Reserve.Status status);

  List<Reserve> findByStatusAndExpiryDateBefore(Reserve.Status status, LocalDateTime now);

  @Query("SELECT r FROM Reserve r WHERE " +
      "(:status IS NULL OR r.status = :status) AND " +
      "(:bookId IS NULL OR r.book.id = :bookId) AND " +
      "(:userId IS NULL OR r.user.id = :userId)")
  Page<Reserve> filterReservations(
      @Param("status") Reserve.Status status,
      @Param("bookId") Long bookId,
      @Param("userId") Long userId,
      Pageable pageable
  );

  long countByStatus(Reserve.Status status);
}
