package com.library.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentRequest {

  @NotBlank(message = "Payment method is required (e.g., CASH, CARD, UPI)")
  private String paymentMethod;

  private String paymentReference;
  private String notes;

  public PaymentRequest() {}

  public String getPaymentMethod() { return paymentMethod; }
  public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

  public String getPaymentReference() { return paymentReference; }
  public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }
}
