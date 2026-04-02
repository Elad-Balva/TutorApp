using Microsoft.EntityFrameworkCore;
using TutorApp.Domain.Entities;

namespace TutorApp.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Student> Students { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<LessonParticipant> LessonParticipants { get; }
    DbSet<Payment> Payments { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
