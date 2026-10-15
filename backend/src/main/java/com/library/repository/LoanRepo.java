package com.library.repository;

import com.library.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface LoanRepo extends JpaRepository<Loan, Long> {

  long countByStatus(Loan.Status status);

  long countByUserIdAndStatusIn(Long userId, Collection<Loan.Status> statuses);

  boolean existsByBookIdAndStatusIn(Long bookId, Collection<Loan.Status> statuses);

  List<Loan> findByStatusAndDueDateBefore(Loan.Status status, LocalDateTime now);

  Page<Loan> findByUserIdOrderByIssueDateDesc(Long userId, Pageable pageable);

  List<Loan> findByUserIdAndStatusInOrderByIssueDateDesc(Long userId, Collection<Loan.Status> statuses);

  @Query("SELECT l FROM Loan l WHERE " +
      "(:status IS NULL OR l.status = :status) AND " +
      "(:userId IS NULL OR l.user.id = :userId) AND " +
      "(:bookId IS NULL OR l.book.id = :bookId) AND " +
      "(:query IS NULL OR :query = '' OR " +
      "LOWER(l.book.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
      "LOWER(l.user.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
      "LOWER(l.user.email) LIKE LOWER(CONCAT('%', :query, '%')))")
  Page<Loan> filterLoans(
      @Param("status") Loan.Status status,
      @Param("userId") Long userId,
      @Param("bookId") Long bookId,
      @Param("query") String query,
      Pageable pageable
  );

  @Query("SELECT l FROM Loan l WHERE l.issueDate BETWEEN :start AND :end ORDER BY l.issueDate DESC")
  List<Loan> findIssuedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  @Query("SELECT l FROM Loan l WHERE l.returnDate BETWEEN :start AND :end ORDER BY l.returnDate DESC")
  List<Loan> findReturnedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  @Query("SELECT l.book.id, l.book.title, l.book.author, COUNT(l.id) as loanCount " +
      "FROM Loan l GROUP BY l.book.id, l.book.title, l.book.author ORDER BY loanCount DESC")
  List<Object[]> findPopularBooks(Pageable pageable);
}
