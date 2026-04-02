using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorApp.Application.DTOs.Common;
using TutorApp.Application.DTOs.Students;
using TutorApp.Application.Interfaces;
using TutorApp.Domain.Entities;
using TutorApp.Domain.Enums;

namespace TutorApp.Application.Services;

public class StudentService : IStudentService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentTeacherService _currentTeacher;
    private readonly ILogger<StudentService> _logger;

    public StudentService(
        IAppDbContext db,
        ICurrentTeacherService currentTeacher,
        ILogger<StudentService> logger)
    {
        _db = db;
        _currentTeacher = currentTeacher;
        _logger = logger;
    }

    public async Task<decimal> GetStudentDebtAsync(Guid studentId, CancellationToken ct)
    {
        var lessonsTotal = await _db.LessonParticipants
            .Where(lp => lp.StudentId == studentId && lp.Lesson.Status == LessonStatus.Completed)
            .SumAsync(lp => (decimal?)lp.TotalPrice, ct) ?? 0m;

        var paidTotal = await _db.Payments
            .Where(p => p.StudentId == studentId)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var debt = decimal.Round(lessonsTotal - paidTotal, 2);
        _logger.LogInformation("Debt calculated for student {StudentId}: {Debt}", studentId, debt);

        return debt;
    }

    public async Task<List<StudentOptionDto>> GetStudentOptionsAsync(string? search, CancellationToken ct)
    {
        var query = _db.Students.Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(term));
        }

        return await query
            .OrderBy(x => x.Name)
            .Select(x => new StudentOptionDto(x.Id, x.Name))
            .Take(100)
            .ToListAsync(ct);
    }

    public async Task<Guid> CreateStudentAsync(CreateStudentRequest request, CancellationToken ct)
    {
        await EnsureTeacherExistsAsync(ct);

        var student = new Student
        {
            TeacherId = _currentTeacher.TeacherId,
            Name = request.Name.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            BaseHourlyPrice = request.BaseHourlyPrice,
            AddressLine = string.IsNullOrWhiteSpace(request.AddressLine) ? null : request.AddressLine.Trim(),
            LocationNotes = string.IsNullOrWhiteSpace(request.LocationNotes) ? null : request.LocationNotes.Trim(),
            IsActive = true,
            JoinedAt = DateTimeOffset.UtcNow
        };

        _db.Students.Add(student);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Student {StudentId} created for teacher {TeacherId}", student.Id, _currentTeacher.TeacherId);

        return student.Id;
    }

    private async Task EnsureTeacherExistsAsync(CancellationToken ct)
    {
        var id = _currentTeacher.TeacherId;
        if (await _db.Teachers.AnyAsync(t => t.Id == id, ct)) return;

        _db.Teachers.Add(new Teacher
        {
            Id = id,
            Name = "Default Teacher",
            Email = "teacher@tutorapp.local"
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<StudentListItemDto>> GetStudentsAsync(string? search, int page, int pageSize, CancellationToken ct)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 10 : pageSize;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _db.Students.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new StudentListItemDto(
                x.Id,
                x.Name,
                x.PhoneNumber,
                x.IsActive,
                x.BaseHourlyPrice,
                x.AddressLine,
                x.LocationNotes,
                x.JoinedAt
            ))
            .ToListAsync(ct);

        return new PagedResult<StudentListItemDto>(items, page, pageSize, totalCount);
    }

    public async Task UpdateStudentAsync(Guid studentId, UpdateStudentRequest request, CancellationToken ct)
    {
        await EnsureTeacherExistsAsync(ct);

        var student = await _db.Students
            .FirstOrDefaultAsync(s => s.Id == studentId, ct)
            ?? throw new KeyNotFoundException("Student not found");

        student.Name = request.Name.Trim();
        student.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        student.BaseHourlyPrice = request.BaseHourlyPrice;
        student.AddressLine = string.IsNullOrWhiteSpace(request.AddressLine) ? null : request.AddressLine.Trim();
        student.LocationNotes = string.IsNullOrWhiteSpace(request.LocationNotes) ? null : request.LocationNotes.Trim();
        student.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Student {StudentId} updated for teacher {TeacherId}", studentId, _currentTeacher.TeacherId);
    }
}
