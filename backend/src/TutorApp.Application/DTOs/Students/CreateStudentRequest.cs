using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Students;

public record CreateStudentRequest(
    [Required, MaxLength(120)] string Name,
    [MaxLength(30)] string? PhoneNumber,
    [Range(0, 99999999.99)] decimal BaseHourlyPrice
);
