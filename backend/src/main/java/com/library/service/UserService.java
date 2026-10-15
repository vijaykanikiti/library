package com.library.service;

import com.library.dto.StatusUpdateRequest;
import com.library.dto.UserDto;
import com.library.entity.User;
import com.library.exception.BadRequest;
import com.library.exception.NotFound;
import com.library.repository.UserRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

  private final UserRepo userRepo;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
  }

  public Page<User> getUsers(User.Role role, Pageable pageable) {
    if (role != null) {
      return userRepo.findByRole(role, pageable);
    }
    return userRepo.findAll(pageable);
  }

  public List<User> searchMembers(String query) {
    if (query == null || query.isBlank()) {
      return userRepo.findByRole(User.Role.STUDENT);
    }
    return userRepo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
  }

  public User getUserById(Long id) {
    return userRepo.findById(id)
        .orElseThrow(() -> new NotFound("User not found with ID: " + id));
  }

  @Transactional
  public UserDto updateProfile(Long id, String name, String phone, String currentPassword, String newPassword) {
    User user = getUserById(id);

    if (name != null && !name.isBlank()) {
      user.setName(name.trim());
    }
    if (phone != null) {
      user.setPhone(phone.trim());
    }

    if (newPassword != null && !newPassword.isBlank()) {
      if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
        throw new BadRequest("Current password is incorrect.");
      }
      if (newPassword.length() < 6) {
        throw new BadRequest("New password must be at least 6 characters.");
      }
      user.setPassword(passwordEncoder.encode(newPassword));
    }

    User saved = userRepo.save(user);
    return UserDto.fromEntity(saved);
  }

  @Transactional
  public UserDto updateStatus(Long id, StatusUpdateRequest req, Long currentAdminId) {
    User user = getUserById(id);

    if (id.equals(currentAdminId) && req.getActive() != null && !req.getActive()) {
      throw new BadRequest("You cannot deactivate your own administrative account.");
    }

    if (req.getActive() != null) {
      user.setActive(req.getActive());
    }

    if (req.getRole() != null) {
      if (user.getRole() == User.Role.ADMIN && req.getRole() != User.Role.ADMIN) {
        if (userRepo.countByRole(User.Role.ADMIN) <= 1) {
          throw new BadRequest("Cannot demote the only remaining administrator.");
        }
      }
      user.setRole(req.getRole());
    }

    User saved = userRepo.save(user);
    return UserDto.fromEntity(saved);
  }
}
