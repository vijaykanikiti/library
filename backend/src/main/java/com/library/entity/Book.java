package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String author;

  @Column(nullable = false, unique = true, length = 30)
  private String isbn;

  @Column(nullable = false, length = 100)
  private String category;

  private String publisher;

  @Column(name = "publication_year")
  private Integer publicationYear;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "shelf_location", length = 50)
  private String shelfLocation;

  @Column(name = "total_copies", nullable = false)
  private Integer totalCopies = 1;

  @Column(name = "available_copies", nullable = false)
  private Integer availableCopies = 1;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public Book() {}

  @PrePersist
  public void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.totalCopies == null) this.totalCopies = 1;
    if (this.availableCopies == null) this.availableCopies = this.totalCopies;
  }

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

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

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
