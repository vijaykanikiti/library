package com.library.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
public class Fine {

  public enum Status {
    UNPAID, PAID
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "loan_id", nullable = false, unique = true)
  private Loan loan;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal amount = BigDecimal.ZERO;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Status status = Status.UNPAID;

  @Column(name = "paid_date")
  private LocalDateTime paidDate;

  @Column(name = "payment_method", length = 50)
  private String paymentMethod;

  @Column(name = "payment_reference", length = 100)
  private String paymentReference;

  @Column(length = 255)
  private String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public Fine() {}

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.amount == null) this.amount = BigDecimal.ZERO;
    if (this.status == null) this.status = Status.UNPAID;
  }

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Loan getLoan() { return loan; }
  public void setLoan(Loan loan) { this.loan = loan; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }

  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }

  public LocalDateTime getPaidDate() { return paidDate; }
  public void setPaidDate(LocalDateTime paidDate) { this.paidDate = paidDate; }

  public String getPaymentMethod() { return paymentMethod; }
  public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

  public String getPaymentReference() { return paymentReference; }
  public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
