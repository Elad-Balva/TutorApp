using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorApp.Application.DTOs.Lessons;
using TutorApp.Application.Interfaces;
using TutorApp.Domain.Entities;
using TutorApp.Domain.Enums;

namespace TutorApp.Application.Services;

public class LessonService : ILessonService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentTeacherService _currentTeacher;
    private readonly ILogger<LessonService> _logger;

    public LessonService(IAppDbContext db, ICurrentTeacherService currentTeacher, ILogger<LessonService> logger)
    {
        _db = db;
        _currentTeacher = currentTeacher;
        _logger = logger;
    }

    public async Task<Guid> CreateLessonAsync(CreateLessonRequest request, CancellationToken ct)
    {
        var lesson = new Lesson
        {
            TeacherId = _currentTeacher.TeacherId,
            StartTime = request.StartTime.ToUniversalTime(),
            Subject = request.Subject,
            ExpectedDurationInHours = request.ExpectedDurationInHours,
            IsInPerson = request.IsInPerson ?? true,
            Status = LessonStatus.Scheduled
        };

        _db.Lessons.Add(lesson);

        var studentIds = request.StudentIds.Distinct().ToList();
        if (studentIds.Count == 0)
            throw new InvalidOperationException("נדרש לפחות תלמיד אחד");

        foreach (var studentId in studentIds)
        {
            var student = await _db.Students.FirstOrDefaultAsync(x => x.Id == studentId, ct)
                ?? throw new KeyNotFoundException($"Student {studentId} not found");

            _db.LessonParticipants.Add(new LessonParticipant
            {
                LessonId = lesson.Id,
                StudentId = student.Id,
                TeacherId = _currentTeacher.TeacherId,
                HourlyPrice = student.BaseHourlyPrice,
                DurationInHours = request.ExpectedDurationInHours,
                TotalPrice = 0m
            });
        }

        await _db.SaveChangesAsync(ct);
        return lesson.Id;
    }

    public async Task AddParticipantsAsync(Guid lessonId, AddParticipantsRequest request, CancellationToken ct)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(x => x.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found");

        if (lesson.Status != LessonStatus.Scheduled)
            throw new InvalidOperationException("Participants can be added only to scheduled lessons");

        var existingStudentIds = await _db.LessonParticipants
            .Where(x => x.LessonId == lessonId)
            .Select(x => x.StudentId)
            .ToListAsync(ct);

        var toAddIds = request.StudentIds.Distinct().Except(existingStudentIds).ToList();
        if (!toAddIds.Any()) return;

        var students = await _db.Students.Where(x => toAddIds.Contains(x.Id)).ToListAsync(ct);

        foreach (var student in students)
        {
            _db.LessonParticipants.Add(new LessonParticipant
            {
                LessonId = lessonId,
                StudentId = student.Id,
                TeacherId = _currentTeacher.TeacherId,
                HourlyPrice = student.BaseHourlyPrice,
                DurationInHours = lesson.ExpectedDurationInHours,
                TotalPrice = 0m
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task CompleteLessonAsync(Guid lessonId, CompleteLessonRequest request, CancellationToken ct)
    {
        var lesson = await _db.Lessons
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found");

        if (lesson.Status != LessonStatus.Scheduled)
            throw new InvalidOperationException("Only scheduled lessons can be completed");

        var reqMap = request.Participants.ToDictionary(x => x.StudentId, x => x);

        foreach (var participant in lesson.Participants)
        {
            if (!reqMap.TryGetValue(participant.StudentId, out var input))
                continue;

            participant.HourlyPrice = input.HourlyPrice;
            participant.DurationInHours = input.DurationInHours;
            participant.TotalPrice = decimal.Round(input.HourlyPrice * input.DurationInHours, 2);
        }

        lesson.Status = LessonStatus.Completed;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Lesson {LessonId} completed for teacher {TeacherId}",
            lessonId,
            _currentTeacher.TeacherId
        );
    }

    public async Task<LessonsDashboardDto> GetDashboardAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        var scheduledRows = await _db.Lessons
            .Where(x => x.Status == LessonStatus.Scheduled)
            .OrderBy(x => x.StartTime)
            .Take(100)
            .Select(x => new
            {
                x.Id,
                x.StartTime,
                x.Subject,
                x.ExpectedDurationInHours,
                x.IsInPerson
            })
            .ToListAsync(ct);

        var futureLessons = new List<LessonDashboardItemDto>();
        var awaitingCompletionLessons = new List<LessonDashboardItemDto>();

        foreach (var lesson in scheduledRows)
        {
            var endUtc = lesson.StartTime.AddHours((double)lesson.ExpectedDurationInHours);
            var isStillFuture = now < endUtc;

            var participants = await _db.LessonParticipants
                .Where(lp => lp.LessonId == lesson.Id)
                .Select(lp => new LessonParticipantDashboardItemDto(
                    lp.StudentId,
                    lp.Student.Name,
                    lp.HourlyPrice,
                    lp.DurationInHours,
                    lp.TotalPrice,
                    false,
                    0m,
                    lp.Student.AddressLine,
                    lp.Student.LocationNotes
                ))
                .ToListAsync(ct);

            var totalPrice = participants.Sum(p => p.TotalPrice);
            var dto = new LessonDashboardItemDto(
                lesson.Id,
                lesson.StartTime,
                lesson.Subject,
                LessonStatus.Scheduled.ToString(),
                lesson.ExpectedDurationInHours,
                lesson.IsInPerson,
                participants,
                totalPrice,
                0m
            );

            if (isStillFuture)
                futureLessons.Add(dto);
            else
                awaitingCompletionLessons.Add(dto);
        }

        futureLessons = futureLessons.OrderBy(x => x.StartTime).Take(50).ToList();
        awaitingCompletionLessons = awaitingCompletionLessons.OrderByDescending(x => x.StartTime).Take(50).ToList();

        var completedLessonRows = await _db.Lessons
            .Where(x => x.Status == LessonStatus.Completed)
            .OrderByDescending(x => x.StartTime)
            .Take(100)
            .Select(x => new
            {
                x.Id,
                x.StartTime,
                x.Subject,
                x.ExpectedDurationInHours,
                x.IsInPerson
            })
            .ToListAsync(ct);

        var unpaidLessons = new List<LessonDashboardItemDto>();
        foreach (var lesson in completedLessonRows)
        {
            var participants = await _db.LessonParticipants
                .Where(lp => lp.LessonId == lesson.Id)
                .Select(lp => new
                {
                    lp.StudentId,
                    lp.Student.Name,
                    lp.HourlyPrice,
                    lp.DurationInHours,
                    lp.TotalPrice
                })
                .ToListAsync(ct);

            var unpaidTotal = 0m;
            var participantDashboard = new List<LessonParticipantDashboardItemDto>(participants.Count);

            foreach (var p in participants)
            {
                var paidForLesson = await _db.Payments
                    .Where(pay => pay.StudentId == p.StudentId && pay.LessonId == lesson.Id)
                    .SumAsync(pay => (decimal?)pay.Amount, ct) ?? 0m;

                var outstanding = decimal.Round(Math.Max(0m, p.TotalPrice - paidForLesson), 2);
                var isPaid = outstanding <= 0m;
                unpaidTotal += outstanding;

                participantDashboard.Add(new LessonParticipantDashboardItemDto(
                    p.StudentId,
                    p.Name,
                    p.HourlyPrice,
                    p.DurationInHours,
                    p.TotalPrice,
                    isPaid,
                    outstanding,
                    null,
                    null
                ));
            }

            unpaidTotal = decimal.Round(unpaidTotal, 2);
            if (unpaidTotal <= 0m) continue;

            unpaidLessons.Add(new LessonDashboardItemDto(
                lesson.Id,
                lesson.StartTime,
                lesson.Subject,
                LessonStatus.Completed.ToString(),
                lesson.ExpectedDurationInHours,
                lesson.IsInPerson,
                participantDashboard,
                participants.Sum(p => p.TotalPrice),
                unpaidTotal
            ));
        }

        return new LessonsDashboardDto(futureLessons, awaitingCompletionLessons, unpaidLessons);
    }

    public async Task<List<LessonReadyToCompleteDto>> GetReadyToCompleteLessonsAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        var lessons = await _db.Lessons
            .Where(x =>
                x.Status == LessonStatus.Scheduled &&
                x.StartTime.AddHours((double)x.ExpectedDurationInHours) <= now)
            .OrderByDescending(x => x.StartTime)
            .Take(100)
            .Select(x => new
            {
                x.Id,
                x.StartTime,
                x.Subject,
                x.ExpectedDurationInHours,
                x.IsInPerson
            })
            .ToListAsync(ct);

        var result = new List<LessonReadyToCompleteDto>(lessons.Count);
        foreach (var lesson in lessons)
        {
            var participants = await _db.LessonParticipants
                .Where(lp => lp.LessonId == lesson.Id)
                .Select(lp => new LessonReadyToCompleteParticipantDto(
                    lp.StudentId,
                    lp.Student.Name,
                    lp.HourlyPrice,
                    lp.DurationInHours,
                    lp.Student.AddressLine,
                    lp.Student.LocationNotes
                ))
                .ToListAsync(ct);

            result.Add(new LessonReadyToCompleteDto(
                lesson.Id,
                lesson.StartTime,
                lesson.Subject,
                lesson.ExpectedDurationInHours,
                lesson.IsInPerson,
                participants
            ));
        }

        return result;
    }

    public async Task UpdateLessonAsync(Guid lessonId, UpdateLessonRequest request, CancellationToken ct)
    {
        var lesson = await _db.Lessons
            .FirstOrDefaultAsync(x => x.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found");

        if (lesson.Status != LessonStatus.Scheduled)
            throw new InvalidOperationException("Only scheduled lessons can be edited");

        lesson.Subject = request.Subject;
        lesson.StartTime = request.StartTime.ToUniversalTime();
        lesson.ExpectedDurationInHours = request.ExpectedDurationInHours;
        lesson.IsInPerson = request.IsInPerson ?? true;

        var desiredStudentIds = request.StudentIds?.Distinct().ToList()
            ?? throw new InvalidOperationException("StudentIds is required");
        if (desiredStudentIds.Count == 0)
            throw new InvalidOperationException("נדרש לפחות תלמיד אחד");
        var existingParticipants = await _db.LessonParticipants
            .Where(lp => lp.LessonId == lessonId)
            .ToListAsync(ct);

        var existingStudentIds = existingParticipants.Select(x => x.StudentId).ToHashSet();
        var toRemove = existingParticipants.Where(x => !desiredStudentIds.Contains(x.StudentId)).ToList();
        if (toRemove.Any())
            _db.LessonParticipants.RemoveRange(toRemove);

        var toAdd = desiredStudentIds.Where(id => !existingStudentIds.Contains(id)).ToList();
        if (toAdd.Any())
        {
            var students = await _db.Students.Where(s => toAdd.Contains(s.Id)).ToListAsync(ct);
            if (students.Count != toAdd.Count)
                throw new KeyNotFoundException("One or more students not found");

            foreach (var student in students)
            {
                _db.LessonParticipants.Add(new LessonParticipant
                {
                    LessonId = lessonId,
                    StudentId = student.Id,
                    TeacherId = _currentTeacher.TeacherId,
                    HourlyPrice = student.BaseHourlyPrice,
                    DurationInHours = request.ExpectedDurationInHours,
                    TotalPrice = 0m
                });
            }
        }

        // Update existing participants to reflect base hourly price + expected duration.
        var participantsToUpdate = await _db.LessonParticipants
            .Where(lp => lp.LessonId == lessonId && desiredStudentIds.Contains(lp.StudentId))
            .ToListAsync(ct);

        foreach (var participant in participantsToUpdate)
        {
            var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == participant.StudentId, ct);
            if (student is null)
                continue;

            participant.HourlyPrice = student.BaseHourlyPrice;
            participant.DurationInHours = request.ExpectedDurationInHours;
            participant.TotalPrice = 0m; // will be recalculated on completion
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Lesson {LessonId} updated for teacher {TeacherId}", lessonId, _currentTeacher.TeacherId);
    }

    public async Task MarkLessonParticipantPaidAsync(Guid lessonId, Guid studentId, MarkLessonParticipantPaidRequest request, CancellationToken ct)
    {
        var lesson = await _db.Lessons
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found");

        if (lesson.Status != LessonStatus.Completed)
            throw new InvalidOperationException("ניתן לסמן תשלום רק לשיעור שהושלם");

        var participant = await _db.LessonParticipants
            .FirstOrDefaultAsync(lp => lp.LessonId == lessonId && lp.StudentId == studentId, ct)
            ?? throw new KeyNotFoundException("התלמיד לא משתתף בשיעור זה");

        var paidForLesson = await _db.Payments
            .Where(pay => pay.StudentId == studentId && pay.LessonId == lessonId)
            .SumAsync(pay => (decimal?)pay.Amount, ct) ?? 0m;

        var outstanding = decimal.Round(Math.Max(0m, participant.TotalPrice - paidForLesson), 2);
        if (outstanding <= 0m)
            return;

        var method = request.PaymentMethod.Trim();
        if (method.Length == 0)
            throw new InvalidOperationException("נא לבחור אמצעי תשלום");

        _db.Payments.Add(new Payment
        {
            TeacherId = _currentTeacher.TeacherId,
            StudentId = studentId,
            LessonId = lessonId,
            Amount = outstanding,
            PaymentDate = DateTimeOffset.UtcNow,
            PaymentMethod = method.Length > 50 ? method[..50] : method,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        });

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation(
            "Marked lesson {LessonId} paid for student {StudentId}, amount {Amount}",
            lessonId,
            studentId,
            outstanding
        );
    }
}
