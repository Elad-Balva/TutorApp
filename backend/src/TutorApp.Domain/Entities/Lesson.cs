using TutorApp.Domain.Enums;

namespace TutorApp.Domain.Entities;

public class Lesson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeacherId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public string Subject { get; set; } = string.Empty;
    public LessonStatus Status { get; set; } = LessonStatus.Scheduled;

    public Teacher Teacher { get; set; } = null!;
    public ICollection<LessonParticipant> Participants { get; set; } = new List<LessonParticipant>();
}
