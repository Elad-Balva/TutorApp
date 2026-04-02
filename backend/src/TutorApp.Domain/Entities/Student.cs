using System.ComponentModel.DataAnnotations;

namespace TutorApp.Domain.Entities;

public class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeacherId { get; set; }

    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? PhoneNumber { get; set; }

    [Range(0, 99999999.99)]
    public decimal BaseHourlyPrice { get; set; }

    /// <summary>Street / city for navigation (e.g. Waze).</summary>
    [MaxLength(500)]
    public string? AddressLine { get; set; }

    /// <summary>Extra arrival hints: floor, apartment, gate code, etc.</summary>
    [MaxLength(300)]
    public string? LocationNotes { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>When the student was added (set automatically on create).</summary>
    public DateTimeOffset JoinedAt { get; set; }

    public Teacher Teacher { get; set; } = null!;
    public ICollection<LessonParticipant> LessonParticipants { get; set; } = new List<LessonParticipant>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
