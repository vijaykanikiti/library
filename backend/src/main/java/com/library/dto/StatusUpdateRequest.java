package com.library.dto;

import com.library.entity.User;

public class StatusUpdateRequest {
  private Boolean active;
  private User.Role role;

  public StatusUpdateRequest() {}

  public Boolean getActive() { return active; }
  public void setActive(Boolean active) { this.active = active; }

  public User.Role getRole() { return role; }
  public void setRole(User.Role role) { this.role = role; }
}
