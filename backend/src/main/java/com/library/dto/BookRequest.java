package com.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BookRequest {

  @NotBlank(message = "Title is required")
  private String title;

  @NotBlank(message = "Author is required")
  private String author;

  @NotBlank(message = "ISBN is required")
  @Size(min = 5, max = 30, message = "ISBN must be between 5 and 30 characters")
  private String isbn;

  @NotBlank(message = "Category is required")
  private String category;

  private String publisher;
  private Integer publicationYear;
  private String description;
  private String shelfLocation;

  @NotNull(message = "Total copies is required")
  @Min(value = 1, message = "Total copies must be at least 1")
  private Integer totalCopies;

  private Integer availableCopies;

  public BookRequest() {}

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getAuthor() { return author; }
  public void setAuthor(String author) { this.author = author; }

  public String getIsbn() { return isbn; }
  public void setIsbn(String isbn) { this.isbn = isbn; }

  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }

  public String getPublisher() { return publisher; }
  public void setPublisher(String publisher) { this.publisher = publisher; }

  public Integer getPublicationYear() { return publicationYear; }
  public void setPublicationYear(Integer publicationYear) { this.publicationYear = publicationYear; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public String getShelfLocation() { return shelfLocation; }
  public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }

  public Integer getTotalCopies() { return totalCopies; }
  public void setTotalCopies(Integer totalCopies) { this.totalCopies = totalCopies; }

  public Integer getAvailableCopies() { return availableCopies; }
  public void setAvailableCopies(Integer availableCopies) { this.availableCopies = availableCopies; }
}
