using System.ComponentModel.DataAnnotations;

namespace TutorApp.Domain.Entities;

public class LessonParticipant
{
    public Guid LessonId { get; set; }
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }

    [Range(0, 99999999.99)]
    public decimal HourlyPrice { get; set; }

    [Range(typeof(decimal), "0.01", "24")]
    public decimal DurationInHours { get; set; }

    [Range(0, 99999999.99)]
    public decimal TotalPrice { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}
