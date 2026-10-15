package com.library.controller;

import com.library.dto.StatusUpdateRequest;
import com.library.dto.UserDto;
import com.library.entity.User;
import com.library.exception.BadRequest;
import com.library.service.AuthService;
import com.library.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserService userService;
  private final AuthService authService;

  public UserController(UserService userService, AuthService authService) {
    this.userService = userService;
    this.authService = authService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<Page<UserDto>> getUsers(
      @RequestParam(required = false) User.Role role,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
    Page<UserDto> users = userService.getUsers(role, pageable).map(UserDto::fromEntity);
    return ResponseEntity.ok(users);
  }

  @GetMapping("/members")
  @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
  public ResponseEntity<List<UserDto>> getMembers(@RequestParam(required = false) String query) {
    List<UserDto> members = userService.searchMembers(query)
        .stream()
        .map(UserDto::fromEntity)
        .collect(Collectors.toList());
    return ResponseEntity.ok(members);
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserDto> getUserById(@PathVariable Long id, Authentication auth) {
    User currentUser = authService.getCurrentUser(auth.getName());
    // Students can only access their own profile
    if (currentUser.getRole() == User.Role.STUDENT && !currentUser.getId().equals(id)) {
      throw new BadRequest("You can only access your own profile.");
    }
    User user = userService.getUserById(id);
    return ResponseEntity.ok(UserDto.fromEntity(user));
  }

  @PutMapping("/{id}")
  public ResponseEntity<UserDto> updateProfile(
      @PathVariable Long id,
      @RequestBody Map<String, String> body,
      Authentication auth
  ) {
    User currentUser = authService.getCurrentUser(auth.getName());
    if (currentUser.getRole() == User.Role.STUDENT && !currentUser.getId().equals(id)) {
      throw new BadRequest("You can only modify your own profile.");
    }

    String name = body.get("name");
    String phone = body.get("phone");
    String currentPassword = body.get("currentPassword");
    String newPassword = body.get("newPassword");

    UserDto updated = userService.updateProfile(id, name, phone, currentPassword, newPassword);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/{id}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<UserDto> updateStatus(
      @PathVariable Long id,
      @RequestBody StatusUpdateRequest req,
      Authentication auth
  ) {
    User currentAdmin = authService.getCurrentUser(auth.getName());
    UserDto updated = userService.updateStatus(id, req, currentAdmin.getId());
    return ResponseEntity.ok(updated);
  }
}
