using System.ComponentModel.DataAnnotations;

namespace TutorApp.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeacherId { get; set; }
    public Guid StudentId { get; set; }

    /// <summary>When set, this payment settles that lesson line for the student (per-lesson outstanding).</summary>
    public Guid? LessonId { get; set; }

    [Range(0, 99999999.99)]
    public decimal Amount { get; set; }

    public DateTimeOffset PaymentDate { get; set; }

    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    public Teacher Teacher { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Lesson? Lesson { get; set; }
}
