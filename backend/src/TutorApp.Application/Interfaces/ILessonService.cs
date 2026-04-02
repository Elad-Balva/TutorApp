using TutorApp.Application.DTOs.Lessons;

namespace TutorApp.Application.Interfaces;

public interface ILessonService
{
    Task<Guid> CreateLessonAsync(CreateLessonRequest request, CancellationToken ct);
    Task AddParticipantsAsync(Guid lessonId, AddParticipantsRequest request, CancellationToken ct);
    Task CompleteLessonAsync(Guid lessonId, CompleteLessonRequest request, CancellationToken ct);
    Task<LessonsDashboardDto> GetDashboardAsync(CancellationToken ct);
}
