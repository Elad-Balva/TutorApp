using TutorApp.Application.DTOs.Common;
using TutorApp.Application.DTOs.Students;

namespace TutorApp.Application.Interfaces;

public interface IStudentService
{
    Task<decimal> GetStudentDebtAsync(Guid studentId, CancellationToken ct);
    Task<List<StudentOptionDto>> GetStudentOptionsAsync(string? search, CancellationToken ct);
    Task<Guid> CreateStudentAsync(CreateStudentRequest request, CancellationToken ct);
    Task<PagedResult<StudentListItemDto>> GetStudentsAsync(string? search, int page, int pageSize, CancellationToken ct);
    Task UpdateStudentAsync(Guid studentId, UpdateStudentRequest request, CancellationToken ct);
}
