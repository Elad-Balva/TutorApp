using Microsoft.AspNetCore.Mvc;
using TutorApp.Application.DTOs.Lessons;
using TutorApp.Application.Interfaces;

namespace TutorApp.Api.Controllers;

[ApiController]
[Route("api/lessons")]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLessonRequest request, CancellationToken ct)
    {
        var id = await _lessonService.CreateLessonAsync(request, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpPost("{lessonId:guid}/participants")]
    public async Task<IActionResult> AddParticipants(Guid lessonId, [FromBody] AddParticipantsRequest request, CancellationToken ct)
    {
        await _lessonService.AddParticipantsAsync(lessonId, request, ct);
        return NoContent();
    }

    [HttpPost("{lessonId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid lessonId, [FromBody] CompleteLessonRequest request, CancellationToken ct)
    {
        await _lessonService.CompleteLessonAsync(lessonId, request, ct);
        return NoContent();
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var data = await _lessonService.GetDashboardAsync(ct);
        return Ok(data);
    }

    [HttpGet("ready-to-complete")]
    public async Task<IActionResult> GetReadyToComplete(CancellationToken ct)
    {
        var lessons = await _lessonService.GetReadyToCompleteLessonsAsync(ct);
        return Ok(lessons);
    }

    [HttpPut("{lessonId:guid}")]
    public async Task<IActionResult> Update(Guid lessonId, [FromBody] UpdateLessonRequest request, CancellationToken ct)
    {
        await _lessonService.UpdateLessonAsync(lessonId, request, ct);
        return NoContent();
    }

    [HttpPost("{lessonId:guid}/participants/{studentId:guid}/mark-paid")]
    public async Task<IActionResult> MarkParticipantPaid(Guid lessonId, Guid studentId, CancellationToken ct)
    {
        await _lessonService.MarkLessonParticipantPaidAsync(lessonId, studentId, ct);
        return NoContent();
    }
}
