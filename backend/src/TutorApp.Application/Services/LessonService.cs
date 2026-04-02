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
            Status = LessonStatus.Scheduled
        };

        _db.Lessons.Add(lesson);

        foreach (var studentId in request.StudentIds.Distinct())
        {
            var student = await _db.Students.FirstOrDefaultAsync(x => x.Id == studentId, ct)
                ?? throw new KeyNotFoundException($"Student {studentId} not found");

            _db.LessonParticipants.Add(new LessonParticipant
            {
                LessonId = lesson.Id,
                StudentId = student.Id,
                TeacherId = _currentTeacher.TeacherId,
                HourlyPrice = student.BaseHourlyPrice,
                DurationInHours = 1.00m,
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
                DurationInHours = 1.00m,
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
}
