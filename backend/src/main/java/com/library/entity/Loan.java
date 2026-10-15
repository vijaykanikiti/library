package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
public class Loan {

  public enum Status {
    ACTIVE, RETURNED, OVERDUE
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "book_id", nullable = false)
  private Book book;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "issued_by_id", nullable = false)
  private User issuedBy;

  @Column(name = "issue_date", nullable = false)
  private LocalDateTime issueDate;

  @Column(name = "due_date", nullable = false)
  private LocalDateTime dueDate;

  @Column(name = "return_date")
  private LocalDateTime returnDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Status status = Status.ACTIVE;

  @Column(name = "renewal_count", nullable = false)
  private Integer renewalCount = 0;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public Loan() {}

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.issueDate == null) this.issueDate = LocalDateTime.now();
    if (this.renewalCount == null) this.renewalCount = 0;
    if (this.status == null) this.status = Status.ACTIVE;
  }

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Book getBook() { return book; }
  public void setBook(Book book) { this.book = book; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public User getIssuedBy() { return issuedBy; }
  public void setIssuedBy(User issuedBy) { this.issuedBy = issuedBy; }

  public LocalDateTime getIssueDate() { return issueDate; }
  public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

  public LocalDateTime getDueDate() { return dueDate; }
  public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

  public LocalDateTime getReturnDate() { return returnDate; }
  public void setReturnDate(LocalDateTime returnDate) { this.returnDate = returnDate; }

  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }

  public Integer getRenewalCount() { return renewalCount; }
  public void setRenewalCount(Integer renewalCount) { this.renewalCount = renewalCount; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
