package com.library.dto;

import jakarta.validation.constraints.NotBlank;

public class SettingUpdateRequest {

  @NotBlank(message = "Setting value is required")
  private String settingValue;

  private String description;

  public SettingUpdateRequest() {}

  public String getSettingValue() { return settingValue; }
  public void setSettingValue(String settingValue) { this.settingValue = settingValue; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
}
