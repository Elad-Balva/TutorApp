namespace TutorApp.Application.DTOs.Lessons;

public record LessonParticipantDashboardItemDto(
    Guid StudentId,
    string StudentName,
    decimal HourlyPrice,
    decimal DurationInHours,
    decimal TotalPrice,
    bool IsPaid,
    decimal OutstandingAmount
);

public record LessonDashboardItemDto(
    Guid LessonId,
    DateTimeOffset StartTime,
    string Subject,
    string Status,
    decimal ExpectedDurationInHours,
    List<LessonParticipantDashboardItemDto> Participants,
    decimal TotalPrice,
    decimal OutstandingTotal
);

public record LessonsDashboardDto(
    List<LessonDashboardItemDto> FutureLessons,
    List<LessonDashboardItemDto> UnpaidLessons
);
