package com.library.controller;

import com.library.dto.BookRequest;
import com.library.entity.Book;
import com.library.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

  private final BookService bookService;

  public BookController(BookService bookService) {
    this.bookService = bookService;
  }

  @GetMapping
  public ResponseEntity<Page<Book>> getBooks(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String category,
      @RequestParam(required = false, defaultValue = "false") Boolean availableOnly,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size,
      @RequestParam(defaultValue = "id") String sortBy,
      @RequestParam(defaultValue = "desc") String sortDir
  ) {
    Page<Book> books = bookService.getBooks(query, category, availableOnly, page, size, sortBy, sortDir);
    return ResponseEntity.ok(books);
  }

  @GetMapping("/featured")
  public ResponseEntity<List<Book>> getFeaturedBooks() {
    return ResponseEntity.ok(bookService.getFeaturedBooks());
  }

  @GetMapping("/categories")
  public ResponseEntity<List<String>> getCategories() {
    return ResponseEntity.ok(bookService.getCategories());
  }

  @GetMapping("/{id}")
  public ResponseEntity<Book> getBookById(@PathVariable Long id) {
    return ResponseEntity.ok(bookService.getBookById(id));
  }

  @PostMapping
  public ResponseEntity<Book> createBook(@Valid @RequestBody BookRequest req) {
    Book created = bookService.createBook(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Book> updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest req) {
    Book updated = bookService.updateBook(id, req);
    return ResponseEntity.ok(updated);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Map<String, String>> deleteBook(@PathVariable Long id) {
    bookService.deleteBook(id);
    Map<String, String> res = new HashMap<>();
    res.put("message", "Book deleted successfully.");
    return ResponseEntity.ok(res);
  }
}
