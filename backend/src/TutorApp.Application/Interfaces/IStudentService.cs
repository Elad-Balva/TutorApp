using TutorApp.Application.DTOs.Students;

namespace TutorApp.Application.Interfaces;

public interface IStudentService
{
    Task<decimal> GetStudentDebtAsync(Guid studentId, CancellationToken ct);
    Task<List<StudentOptionDto>> GetStudentOptionsAsync(string? search, CancellationToken ct);
    Task<Guid> CreateStudentAsync(CreateStudentRequest request, CancellationToken ct);
}
