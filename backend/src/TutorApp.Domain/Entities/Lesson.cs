using TutorApp.Domain.Enums;

namespace TutorApp.Domain.Entities;

public class Lesson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeacherId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public string Subject { get; set; } = string.Empty;
    
    // Expected duration for the lesson (used to prefill participant durations before completion).
    [System.ComponentModel.DataAnnotations.Range(typeof(decimal), "0.01", "24")]
    public decimal ExpectedDurationInHours { get; set; } = 1.00m;

    /// <summary>When true, UI can offer in-person navigation (e.g. Waze) using student addresses.</summary>
    public bool IsInPerson { get; set; } = true;

    public LessonStatus Status { get; set; } = LessonStatus.Scheduled;

    public Teacher Teacher { get; set; } = null!;
    public ICollection<LessonParticipant> Participants { get; set; } = new List<LessonParticipant>();
}
