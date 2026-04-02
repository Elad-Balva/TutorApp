using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record CreateLessonRequest(
    [Required] DateTimeOffset StartTime,
    [Required, MaxLength(120)] string Subject,
    List<Guid> StudentIds
);
