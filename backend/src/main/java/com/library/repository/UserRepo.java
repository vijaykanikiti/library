package com.library.repository;

import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  long countByRole(User.Role role);

  List<User> findByRole(User.Role role);

  List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email);

  Page<User> findByRole(User.Role role, Pageable pageable);
}
