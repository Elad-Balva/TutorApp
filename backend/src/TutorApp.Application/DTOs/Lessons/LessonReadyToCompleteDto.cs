namespace TutorApp.Application.DTOs.Lessons;

public record LessonReadyToCompleteParticipantDto(
    Guid StudentId,
    string StudentName,
    decimal HourlyPrice,
    decimal DurationInHours,
    string? AddressLine,
    string? LocationNotes
);

public record LessonReadyToCompleteDto(
    Guid LessonId,
    DateTimeOffset StartTime,
    string Subject,
    decimal ExpectedDurationInHours,
    bool IsInPerson,
    List<LessonReadyToCompleteParticipantDto> Participants
);

