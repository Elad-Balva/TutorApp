using System.ComponentModel.DataAnnotations;

namespace TutorApp.Application.DTOs.Lessons;

public record AddParticipantsRequest(
    [Required] List<Guid> StudentIds
);
