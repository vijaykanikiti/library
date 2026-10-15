package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_challenges")
public class OtpChallenge {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String email;

  @Column(name = "otp_hash", nullable = false)
  private String otpHash;

  @Column(name = "expiry_time", nullable = false)
  private LocalDateTime expiryTime;

  @Column(nullable = false)
  private Integer attempts = 0;

  @Column(nullable = false)
  private Boolean verified = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public OtpChallenge() {}

  public OtpChallenge(String email, String otpHash, LocalDateTime expiryTime) {
    this.email = email;
    this.otpHash = otpHash;
    this.expiryTime = expiryTime;
    this.attempts = 0;
    this.verified = false;
  }

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    if (this.attempts == null) this.attempts = 0;
    if (this.verified == null) this.verified = false;
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getOtpHash() { return otpHash; }
  public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

  public LocalDateTime getExpiryTime() { return expiryTime; }
  public void setExpiryTime(LocalDateTime expiryTime) { this.expiryTime = expiryTime; }

  public Integer getAttempts() { return attempts; }
  public void setAttempts(Integer attempts) { this.attempts = attempts; }

  public Boolean getVerified() { return verified; }
  public void setVerified(Boolean verified) { this.verified = verified; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
