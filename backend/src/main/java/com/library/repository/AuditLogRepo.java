package com.library.repository;

import com.library.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepo extends JpaRepository<AuditLog, Long> {

  List<AuditLog> findTop20ByOrderByCreatedAtDesc();

  Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
