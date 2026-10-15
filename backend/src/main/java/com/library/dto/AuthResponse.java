package com.library.dto;

public class AuthResponse {
  private String token;
  private UserDto user;
  private String message;
  private boolean requiresOtp;
  private String email;

  public AuthResponse() {}

  public AuthResponse(String message, boolean requiresOtp, String email) {
    this.message = message;
    this.requiresOtp = requiresOtp;
    this.email = email;
  }

  public AuthResponse(String token, UserDto user, String message) {
    this.token = token;
    this.user = user;
    this.message = message;
    this.requiresOtp = false;
    if (user != null) {
      this.email = user.getEmail();
    }
  }

  public String getToken() { return token; }
  public void setToken(String token) { this.token = token; }

  public UserDto getUser() { return user; }
  public void setUser(UserDto user) { this.user = user; }

  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public boolean isRequiresOtp() { return requiresOtp; }
  public void setRequiresOtp(boolean requiresOtp) { this.requiresOtp = requiresOtp; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
}
