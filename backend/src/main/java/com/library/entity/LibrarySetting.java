package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "library_settings")
public class LibrarySetting {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "setting_key", nullable = false, unique = true, length = 100)
  private String settingKey;

  @Column(name = "setting_value", nullable = false)
  private String settingValue;

  @Column(length = 255)
  private String description;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public LibrarySetting() {}

  public LibrarySetting(String settingKey, String settingValue, String description) {
    this.settingKey = settingKey;
    this.settingValue = settingValue;
    this.description = description;
  }

  @PrePersist
  @PreUpdate
  public void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getSettingKey() { return settingKey; }
  public void setSettingKey(String settingKey) { this.settingKey = settingKey; }

  public String getSettingValue() { return settingValue; }
  public void setSettingValue(String settingValue) { this.settingValue = settingValue; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
