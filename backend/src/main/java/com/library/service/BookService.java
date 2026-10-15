package com.library.service;

import com.library.dto.BookRequest;
import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.BookRepo;
import com.library.repository.LoanRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class BookService {

  private final BookRepo bookRepo;
  private final LoanRepo loanRepo;

  public BookService(BookRepo bookRepo, LoanRepo loanRepo) {
    this.bookRepo = bookRepo;
    this.loanRepo = loanRepo;
  }

  public Page<Book> getBooks(String query, String category, Boolean availableOnly, int page, int size, String sortBy, String sortDir) {
    Sort sort = sortDir != null && sortDir.equalsIgnoreCase("desc") ?
        Sort.by(sortBy != null ? sortBy : "id").descending() :
        Sort.by(sortBy != null ? sortBy : "id").ascending();

    Pageable pageable = PageRequest.of(page, size, sort);
    return bookRepo.searchBooks(
        query != null ? query.trim() : "",
        category != null ? category.trim() : null,
        availableOnly != null && availableOnly,
        pageable
    );
  }

  public List<Book> getFeaturedBooks() {
    return bookRepo.findTop8ByOrderByCreatedAtDesc();
  }

  public List<String> getCategories() {
    return bookRepo.findDistinctCategories();
  }

  public Book getBookById(Long id) {
    return bookRepo.findById(id)
        .orElseThrow(() -> new NotFound("Book not found with ID: " + id));
  }

  @Transactional
  public Book createBook(BookRequest req) {
    String isbn = req.getIsbn().trim();
    if (bookRepo.existsByIsbn(isbn)) {
      throw new BadRequest("A book with ISBN '" + isbn + "' already exists.");
    }

    Book book = new Book();
    book.setTitle(req.getTitle().trim());
    book.setAuthor(req.getAuthor().trim());
    book.setIsbn(isbn);
    book.setCategory(req.getCategory().trim());
    book.setPublisher(req.getPublisher() != null ? req.getPublisher().trim() : null);
    book.setPublicationYear(req.getPublicationYear());
    book.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
    book.setShelfLocation(req.getShelfLocation() != null ? req.getShelfLocation().trim() : null);

    int total = req.getTotalCopies() != null && req.getTotalCopies() > 0 ? req.getTotalCopies() : 1;
    book.setTotalCopies(total);
    book.setAvailableCopies(req.getAvailableCopies() != null ? Math.min(req.getAvailableCopies(), total) : total);

    return bookRepo.save(book);
  }

  @Transactional
  public Book updateBook(Long id, BookRequest req) {
    Book book = getBookById(id);

    String isbn = req.getIsbn().trim();
    if (bookRepo.existsByIsbnAndIdNot(isbn, id)) {
      throw new BadRequest("Another book already exists with ISBN '" + isbn + "'.");
    }

    book.setTitle(req.getTitle().trim());
    book.setAuthor(req.getAuthor().trim());
    book.setIsbn(isbn);
    book.setCategory(req.getCategory().trim());
    book.setPublisher(req.getPublisher() != null ? req.getPublisher().trim() : null);
    book.setPublicationYear(req.getPublicationYear());
    book.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
    book.setShelfLocation(req.getShelfLocation() != null ? req.getShelfLocation().trim() : null);

    int oldTotal = book.getTotalCopies();
    int newTotal = req.getTotalCopies() != null ? req.getTotalCopies() : oldTotal;
    if (newTotal < 1) {
      throw new BadRequest("Total copies must be at least 1.");
    }

    int activeLoans = oldTotal - book.getAvailableCopies();
    if (newTotal < activeLoans) {
      throw new BadRequest("Cannot reduce total copies below active loaned copies (" + activeLoans + ").");
    }

    book.setTotalCopies(newTotal);
    book.setAvailableCopies(newTotal - activeLoans);

    return bookRepo.save(book);
  }

  @Transactional
  public void deleteBook(Long id) {
    Book book = getBookById(id);

    boolean hasActiveLoans = loanRepo.existsByBookIdAndStatusIn(id, Arrays.asList(Loan.Status.ACTIVE, Loan.Status.OVERDUE));
    if (hasActiveLoans) {
      throw new BadRequest("Cannot delete book '" + book.getTitle() + "' because there are active or overdue loans associated with it.");
    }

    bookRepo.delete(book);
  }
}
