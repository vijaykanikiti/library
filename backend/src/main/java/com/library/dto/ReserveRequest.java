package com.library.dto;

import jakarta.validation.constraints.NotNull;

public class ReserveRequest {

  @NotNull(message = "Book ID is required")
  private Long bookId;

  public ReserveRequest() {}

  public Long getBookId() { return bookId; }
  public void setBookId(Long bookId) { this.bookId = bookId; }
}
