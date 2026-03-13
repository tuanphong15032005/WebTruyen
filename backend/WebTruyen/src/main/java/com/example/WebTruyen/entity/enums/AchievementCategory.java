package com.example.WebTruyen.entity.enums;

public enum AchievementCategory {
    READING("Đọc truyện"),
    COMMENTING("Bình luận"),
    WRITING("Viết truyện"),
    SOCIAL("Xã hội");

    private final String displayName;

    AchievementCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getName() {
        return this.name();
    }
}
