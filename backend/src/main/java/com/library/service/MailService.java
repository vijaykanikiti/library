package com.library.service;

import com.library.exception.BadRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

  private static final Logger log = LoggerFactory.getLogger(MailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.from:noreply@library.local}")
  private String fromEmail;

  @Value("${app.mail.dev-mode:true}")
  private boolean devMode;

  @Value("${spring.mail.username:}")
  private String smtpUser;

  public MailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void sendOtpEmail(String toEmail, String otpCode) {
    log.info("Sending OTP verification email to: {}", toEmail);

    if (smtpUser == null || smtpUser.isBlank() || smtpUser.contains("your-email")) {
      log.warn("[DEV MODE] SMTP not configured. OTP for {}: {}", toEmail, otpCode);
      if (!devMode) {
        throw new BadRequest("Email delivery failed: SMTP is not configured in application.properties or environment.");
      }
      return;
    }

    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(fromEmail);
      message.setTo(toEmail);
      message.setSubject("Library Management - Your 2FA Verification Code");
      message.setText("Hello,\n\nYour 2-Factor Authentication OTP code is: " + otpCode +
              "\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\nRegards,\nLibrary Management Team");
      mailSender.send(message);
      log.info("OTP successfully sent to {}", toEmail);
    } catch (Exception e) {
      log.error("Failed to deliver real OTP email to {}: {}", toEmail, e.getMessage());
      if (devMode) {
        log.warn("[DEV MODE FALLBACK] OTP for {}: {}", toEmail, otpCode);
      } else {
        throw new BadRequest("Could not send email OTP: " + e.getMessage() + ". Check your SMTP credentials.");
      }
    }
  }

  public void sendNotificationEmail(String toEmail, String subject, String bodyText) {
    if (smtpUser == null || smtpUser.isBlank() || smtpUser.contains("your-email")) {
      log.info("[NOTIFICATION DEV MODE] To: {}, Subject: {}, Message: {}", toEmail, subject, bodyText);
      return;
    }

    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(fromEmail);
      message.setTo(toEmail);
      message.setSubject(subject);
      message.setText(bodyText);
      mailSender.send(message);
    } catch (Exception e) {
      log.warn("Failed to send notification email to {}: {}", toEmail, e.getMessage());
    }
  }
}
