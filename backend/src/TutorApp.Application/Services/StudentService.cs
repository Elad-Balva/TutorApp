using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorApp.Application.Interfaces;
using TutorApp.Domain.Enums;

namespace TutorApp.Application.Services;

public class StudentService : IStudentService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<StudentService> _logger;

    public StudentService(IAppDbContext db, ILogger<StudentService> logger)
    {
        _db = db;
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
}
