using Microsoft.EntityFrameworkCore;
using TutorApp.Application.DTOs.Analytics;
using TutorApp.Application.Interfaces;
using TutorApp.Domain.Enums;

namespace TutorApp.Application.Services;

public class AnalyticsService(IAppDbContext db) : IAnalyticsService
{
    private static readonly string[] HebrewMonths =
        ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

    public async Task<AnalyticsDto> GetAnalyticsAsync(string period, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var (start, prevStart, prevEnd) = GetPeriodBounds(period, now);

        // ── Total income for current period ─────────────────────────────
        var paymentsQ = db.Payments.AsQueryable();
        if (start.HasValue) paymentsQ = paymentsQ.Where(p => p.PaymentDate >= start.Value);
        var totalIncome = await paymentsQ.SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        // ── Income change vs previous period ────────────────────────────
        decimal? incomeChangePercent = null;
        if (prevStart.HasValue && prevEnd.HasValue)
        {
            var ps = prevStart.Value;
            var pe = prevEnd.Value;
            var prevIncome = await db.Payments
                .Where(p => p.PaymentDate >= ps && p.PaymentDate < pe)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

            if (prevIncome > 0)
                incomeChangePercent = Math.Round((totalIncome - prevIncome) / prevIncome * 100m, 1);
        }

        // ── Monthly breakdown — always last 6 calendar months ───────────
        var sixMonthsAgo = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero).AddMonths(-5);
        var rawMonthly = await db.Payments
            .Where(p => p.PaymentDate >= sixMonthsAgo)
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Amount) })
            .ToListAsync(ct);

        var monthlyBreakdown = Enumerable.Range(-5, 6)
            .Select(offset =>
            {
                var m = now.AddMonths(offset);
                var row = rawMonthly.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month);
                return new MonthlyIncomePoint(HebrewMonths[m.Month - 1], row?.Total ?? 0m);
            })
            .ToList();

        // ── New students in period ───────────────────────────────────────
        var studentsQ = db.Students.AsQueryable();
        if (start.HasValue) studentsQ = studentsQ.Where(s => s.JoinedAt >= start.Value);
        var newStudentsCount = await studentsQ.CountAsync(ct);

        // ── Cancelled lessons in period ──────────────────────────────────
        var lessonsQ = db.Lessons.AsQueryable();
        if (start.HasValue) lessonsQ = lessonsQ.Where(l => l.StartTime >= start.Value);
        var cancelledLessonsCount = await lessonsQ.CountAsync(l => l.Status == LessonStatus.Cancelled, ct);
        var totalCompletedLessons = await lessonsQ.CountAsync(l => l.Status == LessonStatus.Completed, ct);

        // ── Top students by amount paid in period ────────────────────────
        var topQ = db.Payments.AsQueryable();
        if (start.HasValue) topQ = topQ.Where(p => p.PaymentDate >= start.Value);
        var topRaw = await topQ
            .GroupBy(p => p.StudentId)
            .Select(g => new { StudentId = g.Key, TotalPaid = g.Sum(p => p.Amount) })
            .OrderByDescending(x => x.TotalPaid)
            .Take(5)
            .ToListAsync(ct);

        var topIds = topRaw.Select(x => x.StudentId).ToList();
        var studentNames = await db.Students
            .Where(s => topIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Name })
            .ToDictionaryAsync(s => s.Id, s => s.Name, ct);

        var topStudents = new List<TopStudentDto>();
        foreach (var item in topRaw)
        {
            var lpQ = db.LessonParticipants
                .Where(lp => lp.StudentId == item.StudentId && lp.Lesson.Status == LessonStatus.Completed);
            if (start.HasValue)
            {
                var s = start.Value;
                lpQ = lpQ.Where(lp => lp.Lesson.StartTime >= s);
            }

            var lessonCount = await lpQ.CountAsync(ct);
            var totalOwed = await lpQ.SumAsync(lp => (decimal?)lp.TotalPrice, ct) ?? 0m;
            var name = studentNames.TryGetValue(item.StudentId, out var n) ? n : "—";
            topStudents.Add(new TopStudentDto(item.StudentId, name, item.TotalPaid, lessonCount, item.TotalPaid >= totalOwed));
        }

        return new AnalyticsDto(totalIncome, incomeChangePercent, monthlyBreakdown,
            newStudentsCount, cancelledLessonsCount, totalCompletedLessons, topStudents);
    }

    private static (DateTimeOffset? start, DateTimeOffset? prevStart, DateTimeOffset? prevEnd) GetPeriodBounds(
        string period, DateTimeOffset now)
    {
        return period.ToLowerInvariant() switch
        {
            "week" => (now.AddDays(-7), now.AddDays(-14), now.AddDays(-7)),
            "year" => (
                new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(now.Year - 1, 1, 1, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero)
            ),
            "all" => (null, null, null),
            _ => ( // month (default)
                new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero).AddMonths(-1),
                new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero)
            ),
        };
    }
}
