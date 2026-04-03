using Microsoft.AspNetCore.Mvc;
using TutorApp.Application.Interfaces;

namespace TutorApp.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController(IAnalyticsService analyticsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string period = "month", CancellationToken ct = default)
    {
        var data = await analyticsService.GetAnalyticsAsync(period, ct);
        return Ok(data);
    }
}
