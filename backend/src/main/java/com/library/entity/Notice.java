package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notice {

  public enum Type {
    INFO, ALERT, SUCCESS, WARNING
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Type type = Type.INFO;

  @Column(name = "is_read", nullable = false)
  private Boolean isRead = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public Notice() {}

  public Notice(User user, String title, String message, Type type) {
    this.user = user;
    this.title = title;
    this.message = message;
    this.type = type != null ? type : Type.INFO;
    this.isRead = false;
  }

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    if (this.isRead == null) this.isRead = false;
    if (this.type == null) this.type = Type.INFO;
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public Type getType() { return type; }
  public void setType(Type type) { this.type = type; }

  public Boolean getIsRead() { return isRead; }
  public void setIsRead(Boolean isRead) { this.isRead = isRead; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
