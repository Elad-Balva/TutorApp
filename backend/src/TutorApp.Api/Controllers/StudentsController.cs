using Microsoft.AspNetCore.Mvc;
using TutorApp.Application.DTOs.Common;
using TutorApp.Application.DTOs.Students;
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudentRequest request, CancellationToken ct)
    {
        var id = await _studentService.CreateStudentAsync(request, ct);
        return CreatedAtAction(nameof(GetDebt), new { studentId = id }, new { id });
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

    [HttpGet]
    public async Task<IActionResult> GetStudents([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _studentService.GetStudentsAsync(search, page, pageSize, ct);
        return Ok(result);
    }

    [HttpPut("{studentId:guid}")]
    public async Task<IActionResult> UpdateStudent(Guid studentId, [FromBody] UpdateStudentRequest request, CancellationToken ct)
    {
        await _studentService.UpdateStudentAsync(studentId, request, ct);
        return NoContent();
    }
}
