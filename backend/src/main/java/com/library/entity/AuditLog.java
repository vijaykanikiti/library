package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id")
  private Long userId;

  @Column(nullable = false, length = 100)
  private String action;

  @Column(name = "entity_type", nullable = false, length = 50)
  private String entityType;

  @Column(name = "entity_id")
  private Long entityId;

  @Column(columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public AuditLog() {}

  public AuditLog(Long userId, String action, String entityType, Long entityId, String details) {
    this.userId = userId;
    this.action = action;
    this.entityType = entityType;
    this.entityId = entityId;
    this.details = details;
  }

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }

  public String getAction() { return action; }
  public void setAction(String action) { this.action = action; }

  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }

  public Long getEntityId() { return entityId; }
  public void setEntityId(Long entityId) { this.entityId = entityId; }

  public String getDetails() { return details; }
  public void setDetails(String details) { this.details = details; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
