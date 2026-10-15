package com.library.repository;

import com.library.entity.LibrarySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LibrarySettingRepo extends JpaRepository<LibrarySetting, Long> {

  Optional<LibrarySetting> findBySettingKey(String settingKey);
}
