using Microsoft.EntityFrameworkCore;
using TutorApp.Application.Interfaces;
using TutorApp.Domain.Entities;

namespace TutorApp.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentTeacherService _currentTeacherService;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentTeacherService currentTeacherService
    ) : base(options)
    {
        _currentTeacherService = currentTeacherService;
    }

    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<LessonParticipant> LessonParticipants => Set<LessonParticipant>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Teacher>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<Student>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(30);
            e.Property(x => x.AddressLine).HasMaxLength(500);
            e.Property(x => x.LocationNotes).HasMaxLength(300);
            e.Property(x => x.BaseHourlyPrice).HasPrecision(10, 2);

            e.HasIndex(x => x.TeacherId);
            e.HasQueryFilter(x => x.TeacherId == _currentTeacherService.TeacherId);

            e.HasOne(x => x.Teacher)
                .WithMany(x => x.Students)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Lesson>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Subject).HasMaxLength(120).IsRequired();
            e.Property(x => x.ExpectedDurationInHours)
                .HasPrecision(10, 2)
                .HasDefaultValue(1.00m)
                .IsRequired();
            e.Property(x => x.IsInPerson).HasDefaultValue(true);

            e.HasIndex(x => x.TeacherId);
            e.HasQueryFilter(x => x.TeacherId == _currentTeacherService.TeacherId);

            e.HasOne(x => x.Teacher)
                .WithMany(x => x.Lessons)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LessonParticipant>(e =>
        {
            e.HasKey(x => new { x.LessonId, x.StudentId });
            e.Property(x => x.HourlyPrice).HasPrecision(10, 2);
            e.Property(x => x.DurationInHours).HasPrecision(10, 2);
            e.Property(x => x.TotalPrice).HasPrecision(10, 2);

            e.HasIndex(x => x.TeacherId);
            e.HasIndex(x => x.LessonId);
            e.HasIndex(x => x.StudentId);
            e.HasQueryFilter(x => x.TeacherId == _currentTeacherService.TeacherId);

            e.HasOne(x => x.Lesson)
                .WithMany(x => x.Participants)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Student)
                .WithMany(x => x.LessonParticipants)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Teacher)
                .WithMany()
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();

            e.HasIndex(x => x.TeacherId);
            e.HasIndex(x => x.StudentId);
            e.HasQueryFilter(x => x.TeacherId == _currentTeacherService.TeacherId);

            e.HasOne(x => x.Teacher)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Student)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
