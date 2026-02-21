package com.example.WebTruyen.dto.request;

import java.util.List;

/*Java tự sinh:
private final fields
constructor đầy đủ tham số
getter (title(), summaryHtml(), …)
equals(), hashCode()
toString()
Không cần Lombok -> thích hợp dùng cho dữ liệu bât biến, chỉ gửi chứ không set*/

public record CreateStoryRequest(String title,
                                 String summaryHtml,
                                 String visibility, // public/unlisted/private
                                 String status,     // draft/published/archived
                                 String kind,       // original/translated/ai
                                 String originalAuthorName,
                                 Long originalAuthorUserId,
                                 String completionStatus, // ongoing/completed/cancelled
                                 List<Long> tagIds) {} //FE nhan dropdown list - khon nhap tag bang ban phim
