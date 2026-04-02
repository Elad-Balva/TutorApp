namespace TutorApp.Application.DTOs.Lessons;

public record LessonDashboardItemDto(
    Guid LessonId,
    DateTimeOffset StartTime,
    string Subject,
    string Status,
    int ParticipantCount,
    decimal TotalPrice
);

public record LessonsDashboardDto(
    List<LessonDashboardItemDto> FutureLessons,
    List<LessonDashboardItemDto> UnpaidLessons
);
