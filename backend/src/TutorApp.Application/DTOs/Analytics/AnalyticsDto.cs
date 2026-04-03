namespace TutorApp.Application.DTOs.Analytics;

public record AnalyticsDto(
    decimal TotalIncome,
    decimal? IncomeChangePercent,
    IReadOnlyList<MonthlyIncomePoint> MonthlyBreakdown,
    int NewStudentsCount,
    int CancelledLessonsCount,
    int TotalCompletedLessons,
    IReadOnlyList<TopStudentDto> TopStudents
);

public record MonthlyIncomePoint(string Label, decimal Amount);

public record TopStudentDto(
    Guid StudentId,
    string Name,
    decimal TotalPaid,
    int LessonCount,
    bool IsFullyPaid
);
