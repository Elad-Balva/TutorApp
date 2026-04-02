namespace TutorApp.Application.DTOs.Lessons;

public record LessonParticipantDashboardItemDto(
    Guid StudentId,
    string StudentName,
    decimal HourlyPrice,
    decimal DurationInHours,
    decimal TotalPrice,
    bool IsPaid,
    decimal OutstandingAmount,
    string? AddressLine,
    string? LocationNotes
);

public record LessonDashboardItemDto(
    Guid LessonId,
    DateTimeOffset StartTime,
    string Subject,
    string Status,
    decimal ExpectedDurationInHours,
    bool IsInPerson,
    List<LessonParticipantDashboardItemDto> Participants,
    decimal TotalPrice,
    decimal OutstandingTotal
);

public record LessonsDashboardDto(
    List<LessonDashboardItemDto> FutureLessons,
    List<LessonDashboardItemDto> AwaitingCompletionLessons,
    List<LessonDashboardItemDto> UnpaidLessons
);
