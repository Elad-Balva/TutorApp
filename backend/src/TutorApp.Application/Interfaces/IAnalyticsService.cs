using TutorApp.Application.DTOs.Analytics;

namespace TutorApp.Application.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsDto> GetAnalyticsAsync(string period, CancellationToken ct);
}
