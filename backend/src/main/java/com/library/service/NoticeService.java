package com.library.service;

import com.library.entity.Notice;
import com.library.entity.User;
import com.library.exception.NotFound;
import com.library.repository.NoticeRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoticeService {

  private final NoticeRepo noticeRepo;
  private final SimpMessagingTemplate messagingTemplate;

  public NoticeService(NoticeRepo noticeRepo, SimpMessagingTemplate messagingTemplate) {
    this.noticeRepo = noticeRepo;
    this.messagingTemplate = messagingTemplate;
  }

  @Transactional
  public Notice sendNotice(User user, String title, String message, Notice.Type type) {
    Notice notice = new Notice(user, title, message, type);
    Notice saved = noticeRepo.save(notice);

    // Push via WebSocket STOMP to user-specific queue
    try {
      messagingTemplate.convertAndSendToUser(
          user.getEmail(),
          "/queue/notices",
          saved
      );
    } catch (Exception e) {
      // Non-blocking WebSocket delivery
    }

    return saved;
  }

  public Page<Notice> getUserNotices(Long userId, Pageable pageable) {
    return noticeRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
  }

  public List<Notice> getUnreadNotices(Long userId) {
    return noticeRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
  }

  public long getUnreadCount(Long userId) {
    return noticeRepo.countByUserIdAndIsReadFalse(userId);
  }

  @Transactional
  public Notice markAsRead(Long noticeId, Long userId) {
    Notice notice = noticeRepo.findById(noticeId)
        .orElseThrow(() -> new NotFound("Notification not found with ID: " + noticeId));

    if (!notice.getUser().getId().equals(userId)) {
      throw new NotFound("Notification not found for this user");
    }

    notice.setIsRead(true);
    return noticeRepo.save(notice);
  }

  @Transactional
  public void markAllAsRead(Long userId) {
    List<Notice> unread = noticeRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    for (Notice notice : unread) {
      notice.setIsRead(true);
    }
    noticeRepo.saveAll(unread);
  }
}
