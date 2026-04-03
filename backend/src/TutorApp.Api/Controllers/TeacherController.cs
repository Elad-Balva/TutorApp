using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TutorApp.Application.Interfaces;

namespace TutorApp.Api.Controllers;

[ApiController]
[Route("api/teacher")]
public class TeacherController(IAppDbContext db, ICurrentTeacherService currentTeacher) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var id = currentTeacher.TeacherId;
        var teacher = await db.Teachers
            .Where(t => t.Id == id)
            .Select(t => new { t.Name, t.Email })
            .FirstOrDefaultAsync(ct);

        if (teacher is null) return NotFound();
        return Ok(teacher);
    }
}
