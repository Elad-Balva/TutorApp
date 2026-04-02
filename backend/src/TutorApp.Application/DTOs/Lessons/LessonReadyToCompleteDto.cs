namespace TutorApp.Application.DTOs.Lessons;

public record LessonReadyToCompleteParticipantDto(
    Guid StudentId,
    string StudentName,
    decimal HourlyPrice,
    decimal DurationInHours
);

public record LessonReadyToCompleteDto(
    Guid LessonId,
    DateTimeOffset StartTime,
    string Subject,
    decimal ExpectedDurationInHours,
    List<LessonReadyToCompleteParticipantDto> Participants
);

