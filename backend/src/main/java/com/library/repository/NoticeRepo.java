package com.library.repository;

import com.library.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepo extends JpaRepository<Notice, Long> {

  List<Notice> findByUserIdOrderByCreatedAtDesc(Long userId);

  Page<Notice> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

  long countByUserIdAndIsReadFalse(Long userId);

  List<Notice> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
}
