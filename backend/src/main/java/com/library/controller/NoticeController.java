package com.library.controller;

import com.library.entity.Notice;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.NoticeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

  private final NoticeService noticeService;
  private final AuthService authService;

  public NoticeController(NoticeService noticeService, AuthService authService) {
    this.noticeService = noticeService;
    this.authService = authService;
  }

  @GetMapping
  public ResponseEntity<Page<Notice>> getNotices(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size,
      Authentication auth
  ) {
    User user = authService.getCurrentUser(auth.getName());
    Pageable pageable = PageRequest.of(page, size);
    Page<Notice> notices = noticeService.getUserNotices(user.getId(), pageable);
    return ResponseEntity.ok(notices);
  }

  @GetMapping("/unread-count")
  public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    long count = noticeService.getUnreadCount(user.getId());
    Map<String, Long> res = new HashMap<>();
    res.put("unreadCount", count);
    return ResponseEntity.ok(res);
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<Notice> markAsRead(@PathVariable Long id, Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    Notice notice = noticeService.markAsRead(id, user.getId());
    return ResponseEntity.ok(notice);
  }

  @PostMapping("/read-all")
  public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
    User user = authService.getCurrentUser(auth.getName());
    noticeService.markAllAsRead(user.getId());
    Map<String, String> res = new HashMap<>();
    res.put("message", "All notifications marked as read.");
    return ResponseEntity.ok(res);
  }
}
