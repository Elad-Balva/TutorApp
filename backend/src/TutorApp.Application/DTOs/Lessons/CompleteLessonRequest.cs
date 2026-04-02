using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record CompleteParticipantRequest(
    [Required] Guid StudentId,
    [Range(0, 99999999.99)] decimal HourlyPrice,
    [Range(typeof(decimal), "0.01", "24")] decimal DurationInHours
);

public record CompleteLessonRequest(
    [Required] List<CompleteParticipantRequest> Participants
);
