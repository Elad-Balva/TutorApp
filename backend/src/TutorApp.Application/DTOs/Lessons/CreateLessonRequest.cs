using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record CreateLessonRequest(
    [Required] DateTimeOffset StartTime,
    [Required, MaxLength(120)] string Subject,
    [Range(typeof(decimal), "0.01", "24")] decimal ExpectedDurationInHours,
    [Required, MinLength(1)] List<Guid> StudentIds,
    bool? IsInPerson
);
