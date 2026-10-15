package com.library.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyOtpRequest {

  @NotBlank(message = "Email is required")
  @Email(message = "Valid email is required")
  private String email;

  @NotBlank(message = "OTP code is required")
  @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be a 6-digit numeric code")
  private String otp;

  public VerifyOtpRequest() {}

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getOtp() { return otp; }
  public void setOtp(String otp) { this.otp = otp; }
}
