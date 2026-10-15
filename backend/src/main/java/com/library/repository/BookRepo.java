package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepo extends JpaRepository<Book, Long> {

  Optional<Book> findByIsbn(String isbn);

  boolean existsByIsbn(String isbn);

  boolean existsByIsbnAndIdNot(String isbn, Long id);

  @Query("SELECT DISTINCT b.category FROM Book b WHERE b.category IS NOT NULL ORDER BY b.category ASC")
  List<String> findDistinctCategories();

  @Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b")
  Long sumTotalCopies();

  @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b")
  Long sumAvailableCopies();

  @Query("SELECT b FROM Book b WHERE " +
      "(:query IS NULL OR :query = '' OR " +
      "LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
      "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
      "LOWER(b.isbn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
      "LOWER(b.category) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
      "(:category IS NULL OR :category = '' OR LOWER(b.category) = LOWER(:category)) AND " +
      "(:availableOnly = false OR b.availableCopies > 0)")
  Page<Book> searchBooks(
      @Param("query") String query,
      @Param("category") String category,
      @Param("availableOnly") boolean availableOnly,
      Pageable pageable
  );

  List<Book> findTop8ByOrderByCreatedAtDesc();
}
