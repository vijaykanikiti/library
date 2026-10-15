package com.library.service;

import com.library.dto.*;
import com.library.entity.OtpChallenge;
import com.library.entity.User;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.OtpChallengeRepo;
import com.library.repository.UserRepo;
import com.library.security.JwtService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private final UserRepo userRepo;
  private final OtpChallengeRepo otpChallengeRepo;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final UserDetailsService userDetailsService;
  private final MailService mailService;

  @Value("${app.otp.expiration-minutes:5}")
  private int otpExpirationMinutes;

  @Value("${app.otp.max-attempts:3}")
  private int maxAttempts;

  @Value("${app.otp.resend-cooldown-seconds:60}")
  private int resendCooldownSeconds;

  @Value("${spring.mail.username:}")
  private String smtpUser;

  private final SecureRandom secureRandom = new SecureRandom();

  public AuthService(
      UserRepo userRepo,
      OtpChallengeRepo otpChallengeRepo,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      UserDetailsService userDetailsService,
      MailService mailService
  ) {
    this.userRepo = userRepo;
    this.otpChallengeRepo = otpChallengeRepo;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.userDetailsService = userDetailsService;
    this.mailService = mailService;
  }

  @Transactional
  public UserDto register(RegisterRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    if (userRepo.existsByEmail(email)) {
      throw new BadRequest("Email is already registered. Please login or use a different email.");
    }

    User user = new User();
    user.setName(req.getName().trim());
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(req.getPassword()));
    user.setPhone(req.getPhone() != null ? req.getPhone().trim() : null);
    // Force STUDENT role for public registration
    user.setRole(User.Role.STUDENT);
    user.setActive(true);

    User saved = userRepo.save(user);
    return UserDto.fromEntity(saved);
  }

  @Transactional
  public AuthResponse login(LoginRequest req) {
    String email = req.getEmail().trim().toLowerCase();

    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (!user.getActive()) {
      throw new BadRequest("Account is inactive or suspended. Please contact the administrator.");
    }

    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(email, req.getPassword())
      );
    } catch (BadCredentialsException ex) {
      throw new BadCredentialsException("Invalid email or password");
    }

    // If real SMTP credentials are provided, enforce 2FA OTP verification
    if (smtpUser != null && !smtpUser.isBlank() && !smtpUser.contains("your-email")) {
      generateAndSendOtp(email);
      return new AuthResponse("Password verified. A 6-digit verification OTP has been sent to your email.", true, email);
    }

    // Direct authentication when SMTP is not configured
    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
    String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());
    return new AuthResponse(token, UserDto.fromEntity(user), "Login successful.");
  }

  @Transactional
  public AuthResponse resendOtp(ResendOtpRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new NotFound("User not found with email: " + email));

    if (!user.getActive()) {
      throw new BadRequest("Account is deactivated.");
    }

    // Check cooldown against previous challenge
    otpChallengeRepo.findFirstByEmailOrderByCreatedAtDesc(email).ifPresent(lastChallenge -> {
      long secondsSince = ChronoUnit.SECONDS.between(lastChallenge.getCreatedAt(), LocalDateTime.now());
      if (secondsSince < resendCooldownSeconds) {
        throw new BadRequest("Please wait " + (resendCooldownSeconds - secondsSince) + " seconds before requesting a new OTP.");
      }
    });

    generateAndSendOtp(email);
    return new AuthResponse("A new OTP verification code has been dispatched to your email.", true, email);
  }

  private void generateAndSendOtp(String email) {
    int code = 100000 + secureRandom.nextInt(900000);
    String otpString = String.valueOf(code);

    String otpHash = passwordEncoder.encode(otpString);
    LocalDateTime expiry = LocalDateTime.now().plusMinutes(otpExpirationMinutes);

    OtpChallenge challenge = new OtpChallenge(email, otpHash, expiry);
    otpChallengeRepo.save(challenge);

    // Send email
    mailService.sendOtpEmail(email, otpString);
  }

  @Transactional
  public AuthResponse verifyOtp(VerifyOtpRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    String otp = req.getOtp().trim();

    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new NotFound("User not found with email: " + email));

    if (!user.getActive()) {
      throw new BadRequest("Account is deactivated.");
    }

    OtpChallenge challenge = otpChallengeRepo.findFirstByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)
        .orElseThrow(() -> new BadRequest("No active OTP request found. Please login again."));

    if (challenge.getExpiryTime().isBefore(LocalDateTime.now())) {
      throw new BadRequest("OTP has expired. Please request a new verification code.");
    }

    if (challenge.getAttempts() >= maxAttempts) {
      throw new BadRequest("Maximum OTP verification attempts exceeded. Please request a new code.");
    }

    challenge.setAttempts(challenge.getAttempts() + 1);

    if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {
      otpChallengeRepo.save(challenge);
      int remaining = maxAttempts - challenge.getAttempts();
      throw new BadRequest("Incorrect OTP code. " + (remaining > 0 ? remaining + " attempts remaining." : "Please request a new code."));
    }

    // OTP verified successfully
    challenge.setVerified(true);
    otpChallengeRepo.save(challenge);

    // Issue JWT token
    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
    String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

    return new AuthResponse(token, UserDto.fromEntity(user), "Authentication successful.");
  }

  @Transactional
  public AuthResponse googleLogin(GoogleLoginRequest req) {
    String email = req.getEmail().trim().toLowerCase();
    User user = userRepo.findByEmail(email).orElse(null);

    if (user == null) {
      user = new User();
      String name = req.getName() != null && !req.getName().isBlank() ? req.getName().trim() : email.split("@")[0];
      user.setName(name);
      user.setEmail(email);
      user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
      user.setRole(User.Role.STUDENT);
      user.setActive(true);
      user = userRepo.save(user);
    } else {
      if (!user.getActive()) {
        throw new BadRequest("Account is inactive or suspended. Please contact the administrator.");
      }
    }

    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
    String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

    return new AuthResponse(token, UserDto.fromEntity(user), "Google authentication successful.");
  }

  public User getCurrentUser(String email) {
    return userRepo.findByEmail(email)
        .orElseThrow(() -> new NotFound("Authenticated user not found."));
  }
}
