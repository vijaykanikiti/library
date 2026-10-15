package com.library.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResendOtpRequest {

  @NotBlank(message = "Email is required")
  @Email(message = "Valid email is required")
  private String email;

  public ResendOtpRequest() {}

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
}
