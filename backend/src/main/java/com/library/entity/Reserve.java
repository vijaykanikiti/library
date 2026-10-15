package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reserve {

  public enum Status {
    PENDING, AVAILABLE, CANCELLED, COMPLETED, EXPIRED
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

  @Column(name = "reserve_date", nullable = false)
  private LocalDateTime reserveDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Status status = Status.PENDING;

  @Column(name = "expiry_date")
  private LocalDateTime expiryDate;

  @Column(name = "queue_order", nullable = false)
  private Integer queueOrder = 1;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public Reserve() {}

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.reserveDate == null) this.reserveDate = LocalDateTime.now();
    if (this.status == null) this.status = Status.PENDING;
    if (this.queueOrder == null) this.queueOrder = 1;
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

  public LocalDateTime getReserveDate() { return reserveDate; }
  public void setReserveDate(LocalDateTime reserveDate) { this.reserveDate = reserveDate; }

  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }

  public LocalDateTime getExpiryDate() { return expiryDate; }
  public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }

  public Integer getQueueOrder() { return queueOrder; }
  public void setQueueOrder(Integer queueOrder) { this.queueOrder = queueOrder; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
