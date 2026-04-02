using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorApp.Domain.Entities;
using TutorApp.Domain.Enums;

namespace TutorApp.Infrastructure.Data;

public static class DemoDataSeeder
{
    private static readonly Guid TeacherId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public static async Task SeedIfEmptyAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        var studentsExist = await db.Students.AnyAsync(ct);
        var now = DateTimeOffset.UtcNow;

        var hasDueScheduledLesson = await db.Lessons.AnyAsync(
            l => l.Status == LessonStatus.Scheduled && l.StartTime <= now,
            ct
        );

        if (studentsExist && hasDueScheduledLesson)
        {
            logger.LogInformation("Demo seed skipped: students exist and due scheduled lesson already exists.");
            return;
        }

        if (!studentsExist)
            logger.LogInformation("Seeding demo data for empty database...");

        if (!await db.Teachers.AnyAsync(t => t.Id == TeacherId, ct))
        {
            db.Teachers.Add(new Teacher
            {
                Id = TeacherId,
                Name = "מורה לדוגמה",
                Email = "demo@tutorapp.local"
            });
        }

        if (!studentsExist)
        {
            var s1 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            var s2 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
            var s3 = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
            var s4 = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
            var s5 = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
            var s6 = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

            var students = new[]
            {
                new Student { Id = s1, TeacherId = TeacherId, Name = "נועה כהן", PhoneNumber = "050-1112233", BaseHourlyPrice = 120m, IsActive = true },
                new Student { Id = s2, TeacherId = TeacherId, Name = "איתי לוי", PhoneNumber = "052-4445566", BaseHourlyPrice = 100m, IsActive = true },
                new Student { Id = s3, TeacherId = TeacherId, Name = "מיה דוד", PhoneNumber = "054-7778899", BaseHourlyPrice = 140m, IsActive = true },
                new Student { Id = s4, TeacherId = TeacherId, Name = "יונתן ברק", PhoneNumber = "053-2223344", BaseHourlyPrice = 110m, IsActive = true },
                new Student { Id = s5, TeacherId = TeacherId, Name = "שירה אבני", PhoneNumber = "050-9998877", BaseHourlyPrice = 95m, IsActive = true },
                new Student { Id = s6, TeacherId = TeacherId, Name = "רועי גל", PhoneNumber = "058-1234567", BaseHourlyPrice = 130m, IsActive = true },
            };

            db.Students.AddRange(students);

            var future1 = Guid.Parse("10101010-1010-1010-1010-101010101010");
            var future2 = Guid.Parse("20202020-2020-2020-2020-202020202020");
            var future3 = Guid.Parse("30303030-3030-3030-3030-303030303030");

        static DateTimeOffset UtcDayHour(int daysFromToday, int hourUtc)
        {
            var t = DateTimeOffset.UtcNow.AddDays(daysFromToday);
            return new DateTimeOffset(t.Year, t.Month, t.Day, hourUtc, 0, 0, TimeSpan.Zero);
        }

        db.Lessons.AddRange(
            new Lesson
            {
                Id = future1,
                TeacherId = TeacherId,
                StartTime = UtcDayHour(2, 14),
                Subject = "מתמטיקה — חזרה לבחינה",
                ExpectedDurationInHours = 1m,
                Status = LessonStatus.Scheduled
            },
            new Lesson
            {
                Id = future2,
                TeacherId = TeacherId,
                StartTime = UtcDayHour(5, 16),
                Subject = "אנגלית — דיבור",
                ExpectedDurationInHours = 1m,
                Status = LessonStatus.Scheduled
            },
            new Lesson
            {
                Id = future3,
                TeacherId = TeacherId,
                StartTime = UtcDayHour(9, 10),
                Subject = "פיזיקה — תרגול",
                ExpectedDurationInHours = 1m,
                Status = LessonStatus.Scheduled
            });

        db.LessonParticipants.AddRange(
            new LessonParticipant { LessonId = future1, StudentId = s1, TeacherId = TeacherId, HourlyPrice = 120m, DurationInHours = 1m, TotalPrice = 0m },
            new LessonParticipant { LessonId = future1, StudentId = s2, TeacherId = TeacherId, HourlyPrice = 100m, DurationInHours = 1m, TotalPrice = 0m },
            new LessonParticipant { LessonId = future2, StudentId = s3, TeacherId = TeacherId, HourlyPrice = 140m, DurationInHours = 1m, TotalPrice = 0m },
            new LessonParticipant { LessonId = future2, StudentId = s4, TeacherId = TeacherId, HourlyPrice = 110m, DurationInHours = 1m, TotalPrice = 0m },
            new LessonParticipant { LessonId = future3, StudentId = s5, TeacherId = TeacherId, HourlyPrice = 95m, DurationInHours = 1m, TotalPrice = 0m },
            new LessonParticipant { LessonId = future3, StudentId = s6, TeacherId = TeacherId, HourlyPrice = 130m, DurationInHours = 1m, TotalPrice = 0m }
        );

        var done1 = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
        var done2 = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
        var done3 = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

        db.Lessons.AddRange(
            new Lesson
            {
                Id = done1,
                TeacherId = TeacherId,
                StartTime = now.AddDays(-10),
                Subject = "מתמטיקה — משוואות",
                ExpectedDurationInHours = 1.5m,
                Status = LessonStatus.Completed
            },
            new Lesson
            {
                Id = done2,
                TeacherId = TeacherId,
                StartTime = now.AddDays(-5),
                Subject = "אנגלית — כתיבה",
                ExpectedDurationInHours = 1m,
                Status = LessonStatus.Completed
            },
            new Lesson
            {
                Id = done3,
                TeacherId = TeacherId,
                StartTime = now.AddDays(-2),
                Subject = "עברית — חיבור",
                ExpectedDurationInHours = 2m,
                Status = LessonStatus.Completed
            });

        db.LessonParticipants.AddRange(
            new LessonParticipant { LessonId = done1, StudentId = s1, TeacherId = TeacherId, HourlyPrice = 120m, DurationInHours = 1.5m, TotalPrice = 180m },
            new LessonParticipant { LessonId = done1, StudentId = s2, TeacherId = TeacherId, HourlyPrice = 100m, DurationInHours = 1m, TotalPrice = 100m },
            new LessonParticipant { LessonId = done2, StudentId = s3, TeacherId = TeacherId, HourlyPrice = 140m, DurationInHours = 1m, TotalPrice = 140m },
            new LessonParticipant { LessonId = done3, StudentId = s4, TeacherId = TeacherId, HourlyPrice = 110m, DurationInHours = 2m, TotalPrice = 220m }
        );

            db.Payments.AddRange(
                new Payment
                {
                    Id = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
                    TeacherId = TeacherId,
                    StudentId = s1,
                    Amount = 100m,
                    PaymentDate = now.AddDays(-9),
                    PaymentMethod = "מזומן"
                },
                new Payment
                {
                    Id = Guid.Parse("b2222222-2222-2222-2222-222222222222"),
                    TeacherId = TeacherId,
                    StudentId = s3,
                    Amount = 50m,
                    PaymentDate = now.AddDays(-4),
                    PaymentMethod = "העברה"
                }
            );
        }

        // Ensure we have at least one scheduled-due lesson for the "complete lesson" page.
        var dueLessonId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
        if (!await db.Lessons.AnyAsync(l => l.Id == dueLessonId, ct))
        {
            var dueStudents = await db.Students
                .OrderBy(s => s.Name)
                .Take(2)
                .ToListAsync(ct);

            if (dueStudents.Count > 0)
            {
                var start = new DateTimeOffset(now.Year, now.Month, now.Day, 18, 0, 0, TimeSpan.Zero).AddDays(-1);

                db.Lessons.Add(new Lesson
                {
                    Id = dueLessonId,
                    TeacherId = TeacherId,
                    StartTime = start,
                    Subject = "שיעור דחוף — השלמה",
                    ExpectedDurationInHours = 1m,
                    Status = LessonStatus.Scheduled
                });

                db.LessonParticipants.AddRange(
                    dueStudents.Select(s => new LessonParticipant
                    {
                        LessonId = dueLessonId,
                        StudentId = s.Id,
                        TeacherId = TeacherId,
                        HourlyPrice = s.BaseHourlyPrice,
                        DurationInHours = 1m,
                        TotalPrice = 0m
                    })
                );
            }
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Demo seed completed (if needed).");
    }
}
