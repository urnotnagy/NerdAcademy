using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;


namespace NerdAcademy.API.Controllers
{
    [ApiController]
    public class LessonsController : ControllerBase
    {
        private readonly ILessonService _svc;
        private readonly IMapper _mapper;

        public LessonsController(ILessonService svc, IMapper mapper)
        {
            _svc = svc;
            _mapper = mapper;
        }

        // GET /api/courses/{courseId}/lessons
        [HttpGet("api/courses/{courseId:guid}/lessons")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LessonReadDto>>> GetByCourse(Guid courseId)
        {
            var lessons = await _svc.GetAllAsync(courseId);
            return Ok(_mapper.Map<IEnumerable<LessonReadDto>>(lessons));
        }

        // GET /api/lessons/{id}
        [HttpGet("api/lessons/{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<LessonReadDto>> GetById(Guid id)
        {
            var lesson = await _svc.GetByIdAsync(id);
            if (lesson == null) return NotFound();
            return Ok(_mapper.Map<LessonReadDto>(lesson));
        }

        // POST /api/courses/{courseId}/lessons
        [HttpPost("api/courses/{courseId:guid}/lessons")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonReadDto>> Create(Guid courseId, [FromBody] LessonCreateDto dto)
        {
            var lesson = _mapper.Map<Lesson>(dto);
            lesson.CourseId = courseId;
            lesson.CreatedAt = DateTime.UtcNow;

            var created = await _svc.CreateAsync(lesson);
            var result = _mapper.Map<LessonReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // PUT /api/lessons/{id}
        [HttpPut("api/lessons/{id:guid}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] LessonUpdateDto dto)
        {
            var lesson = await _svc.GetByIdAsync(id);
            if (lesson == null) return NotFound();

            _mapper.Map(dto, lesson);
            await _svc.UpdateAsync(lesson);
            return NoContent();
        }

        // DELETE /api/lessons/{id}
        [HttpDelete("api/lessons/{id:guid}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _svc.DeleteAsync(id);
            return NoContent();
        }
    }
}