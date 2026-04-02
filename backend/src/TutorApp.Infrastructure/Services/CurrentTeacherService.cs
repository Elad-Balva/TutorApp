using TutorApp.Application.Interfaces;

namespace TutorApp.Infrastructure.Services;

public sealed class CurrentTeacherService : ICurrentTeacherService
{
    public Guid TeacherId => Guid.Parse("11111111-1111-1111-1111-111111111111");
}
