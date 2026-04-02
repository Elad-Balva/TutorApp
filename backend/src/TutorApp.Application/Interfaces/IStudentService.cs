namespace TutorApp.Application.Interfaces;

public interface IStudentService
{
    Task<decimal> GetStudentDebtAsync(Guid studentId, CancellationToken ct);
}
