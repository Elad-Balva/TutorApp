namespace TutorApp.Application.DTOs.Students;

public record StudentListItemDto(
    Guid Id,
    string Name,
    string? PhoneNumber,
    bool IsActive,
    decimal BaseHourlyPrice,
    string? AddressLine,
    string? LocationNotes
);

