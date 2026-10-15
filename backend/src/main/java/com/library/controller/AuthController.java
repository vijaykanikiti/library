package com.library.controller;

import com.library.dto.*;
import com.library.entity.User;
import com.library.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req) {
    UserDto registered = authService.register(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(registered);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
    AuthResponse res = authService.login(req);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/verify-otp")
  public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
    AuthResponse res = authService.verifyOtp(req);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/resend-otp")
  public ResponseEntity<AuthResponse> resendOtp(@Valid @RequestBody ResendOtpRequest req) {
    AuthResponse res = authService.resendOtp(req);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/google")
  public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest req) {
    AuthResponse res = authService.googleLogin(req);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/me")
  public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    User user = authService.getCurrentUser(authentication.getName());
    return ResponseEntity.ok(UserDto.fromEntity(user));
  }

  @PostMapping("/logout")
  public ResponseEntity<Map<String, String>> logout() {
    Map<String, String> res = new HashMap<>();
    res.put("message", "Logged out successfully.");
    return ResponseEntity.ok(res);
  }
}
