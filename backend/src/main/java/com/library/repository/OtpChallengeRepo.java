package com.library.repository;

import com.library.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpChallengeRepo extends JpaRepository<OtpChallenge, Long> {

  Optional<OtpChallenge> findFirstByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

  Optional<OtpChallenge> findFirstByEmailOrderByCreatedAtDesc(String email);

  void deleteByExpiryTimeBefore(LocalDateTime time);
}
