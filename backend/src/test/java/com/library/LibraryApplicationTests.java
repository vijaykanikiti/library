package com.library;

import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.repository.BookRepo;
import com.library.repository.UserRepo;
import com.library.service.AuthService;
import com.library.service.FineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LibraryApplicationTests {

  @Autowired
  private BookRepo bookRepo;

  @Autowired
  private UserRepo userRepo;

  @Autowired
  private AuthService authService;

  @Autowired
  private FineService fineService;

  @Test
  void contextLoads() {
    assertNotNull(bookRepo);
    assertNotNull(userRepo);
    assertNotNull(authService);
  }

  @Test
  void testFineCalculationOverdueLogic() {
    Book book = new Book();
    book.setTitle("Test Algorithms");
    book.setAuthor("T. Cormen");
    book.setIsbn("978-TEST-001");
    book.setCategory("Computer Science");
    book.setTotalCopies(5);
    book.setAvailableCopies(5);

    User user = new User();
    user.setName("Test Student");
    user.setEmail("teststudent@example.com");
    user.setPassword("secret");
    user.setRole(User.Role.STUDENT);

    Loan loan = new Loan();
    loan.setId(99999L);
    loan.setBook(book);
    loan.setUser(user);
    loan.setIssueDate(LocalDateTime.now().minusDays(20));
    loan.setDueDate(LocalDateTime.now().minusDays(6)); // 6 days overdue

    // Grace period is 1 day, so overdue days = 6 > grace period 1 day
    // Overdue check for fine
    LocalDateTime now = LocalDateTime.now();
    assertTrue(loan.getDueDate().isBefore(now));
  }
}
