package com.library.controller;

import com.library.dto.SettingUpdateRequest;
import com.library.entity.AuditLog;
import com.library.entity.LibrarySetting;
import com.library.exception.NotFound;
import com.library.repository.AuditLogRepo;
import com.library.repository.LibrarySettingRepo;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final LibrarySettingRepo settingRepo;
  private final AuditLogRepo auditLogRepo;
  private final LoanService loanService;

  public AdminController(
      LibrarySettingRepo settingRepo,
      AuditLogRepo auditLogRepo,
      LoanService loanService
  ) {
    this.settingRepo = settingRepo;
    this.auditLogRepo = auditLogRepo;
    this.loanService = loanService;
  }

  @GetMapping("/settings")
  public ResponseEntity<List<LibrarySetting>> getAllSettings() {
    return ResponseEntity.ok(settingRepo.findAll());
  }

  @PutMapping("/settings/{key}")
  public ResponseEntity<LibrarySetting> updateSetting(
      @PathVariable String key,
      @Valid @RequestBody SettingUpdateRequest req
  ) {
    LibrarySetting setting = settingRepo.findBySettingKey(key)
        .orElseThrow(() -> new NotFound("Setting not found with key: " + key));

    setting.setSettingValue(req.getSettingValue().trim());
    if (req.getDescription() != null) {
      setting.setDescription(req.getDescription());
    }

    LibrarySetting saved = settingRepo.save(setting);
    return ResponseEntity.ok(saved);
  }

  @GetMapping("/audit-logs")
  public ResponseEntity<Page<AuditLog>> getAuditLogs(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ) {
    Pageable pageable = PageRequest.of(page, size);
    return ResponseEntity.ok(auditLogRepo.findAllByOrderByCreatedAtDesc(pageable));
  }

  @PostMapping("/run-overdue-check")
  public ResponseEntity<Map<String, String>> runOverdueCheck() {
    loanService.checkAndAlertOverdueLoans();
    Map<String, String> res = new HashMap<>();
    res.put("message", "Overdue check completed. Fines calculated and notifications dispatched.");
    return ResponseEntity.ok(res);
  }
}
