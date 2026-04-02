using Microsoft.AspNetCore.Mvc;
using TutorApp.Application.Interfaces;

namespace TutorApp.Api.Controllers;

[ApiController]
[Route("api/students")]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet("{studentId:guid}/debt")]
    public async Task<IActionResult> GetDebt(Guid studentId, CancellationToken ct)
    {
        var debt = await _studentService.GetStudentDebtAsync(studentId, ct);
        return Ok(new { studentId, debt });
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions([FromQuery] string? search, CancellationToken ct)
    {
        var options = await _studentService.GetStudentOptionsAsync(search, ct);
        return Ok(options);
    }
}
