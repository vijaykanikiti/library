package com.library.dto;

import jakarta.validation.constraints.NotNull;

public class IssueRequest {

  @NotNull(message = "Book ID is required")
  private Long bookId;

  @NotNull(message = "Member User ID is required")
  private Long userId;

  private Integer dueDays;

  public IssueRequest() {}

  public Long getBookId() { return bookId; }
  public void setBookId(Long bookId) { this.bookId = bookId; }

  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }

  public Integer getDueDays() { return dueDays; }
  public void setDueDays(Integer dueDays) { this.dueDays = dueDays; }
}
