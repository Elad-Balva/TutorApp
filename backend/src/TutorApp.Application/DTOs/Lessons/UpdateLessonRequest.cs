using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record UpdateLessonRequest(
    [Required, MaxLength(120)] string Subject,
    [Required] DateTimeOffset StartTime,
    [Range(typeof(decimal), "0.01", "24")] decimal ExpectedDurationInHours,
    [Required, MinLength(1)] List<Guid> StudentIds,
    bool? IsInPerson
);

