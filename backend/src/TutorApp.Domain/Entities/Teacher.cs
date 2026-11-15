namespace TutorApp.Domain.Entities;

public class Teacher
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
