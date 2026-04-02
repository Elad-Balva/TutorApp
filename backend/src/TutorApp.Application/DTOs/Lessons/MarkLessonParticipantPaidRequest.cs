using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record MarkLessonParticipantPaidRequest(
    [Required, MaxLength(50)] string PaymentMethod,
    [MaxLength(500)] string? Notes
);
