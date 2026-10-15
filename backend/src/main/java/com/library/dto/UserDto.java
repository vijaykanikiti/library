package com.library.dto;

import com.library.entity.User;
import java.time.LocalDateTime;

public class UserDto {
  private Long id;
  private String name;
  private String email;
  private String phone;
  private User.Role role;
  private Boolean active;
  private LocalDateTime createdAt;

  public UserDto() {}

  public UserDto(Long id, String name, String email, String phone, User.Role role, Boolean active, LocalDateTime createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.active = active;
    this.createdAt = createdAt;
  }

  public static UserDto fromEntity(User user) {
    if (user == null) return null;
    return new UserDto(
      user.getId(),
      user.getName(),
      user.getEmail(),
      user.getPhone(),
      user.getRole(),
      user.getActive(),
      user.getCreatedAt()
    );
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }

  public User.Role getRole() { return role; }
  public void setRole(User.Role role) { this.role = role; }

  public Boolean getActive() { return active; }
  public void setActive(Boolean active) { this.active = active; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
