using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NerdAcademy.API.Controllers
{
    [ApiController]
    public class LessonsController : ControllerBase
    {
        private readonly ILessonService _lessonSvc;
        private readonly ICourseService _courseSvc;
        private readonly IEnrollmentService _enrollSvc;
        private readonly IMapper _mapper;

        public LessonsController(
            ILessonService lessonSvc,
            ICourseService courseSvc,
            IEnrollmentService enrollSvc,
            IMapper mapper)
        {
            _lessonSvc = lessonSvc;
            _courseSvc = courseSvc;
            _enrollSvc = enrollSvc;
            _mapper = mapper;
        }

        // GET /api/courses/{courseId}/lessons
        [HttpGet("api/courses/{courseId:guid}/lessons")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonReadDto>>> GetByCourse(Guid courseId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("Admin");
            var isInstructor = User.IsInRole("Instructor");
            var isStudent = User.IsInRole("Student");

            // Admin can see any
            if (!isAdmin)
            {
                // Instructor can see only their courses
                if (isInstructor)
                {
                    var course = await _courseSvc.GetByIdAsync(courseId);
                    if (course == null) return NotFound();
                    if (course.InstructorId != userId) return Forbid();
                }
                // Student can see only if enrolled
                else if (isStudent)
                {
                    var enrolls = await _enrollSvc.GetAllAsync();
                    if (!enrolls.Any(e => e.CourseId == courseId && e.StudentId == userId))
                        return Forbid();
                }
                else
                {
                    // any other role => forbidden
                    return Forbid();
                }
            }

            // authorized => return lessons
            var lessons = await _lessonSvc.GetAllAsync(courseId);
            return Ok(_mapper.Map<IEnumerable<LessonReadDto>>(lessons));
        }


        [HttpGet("api/lessons/{id:guid}")]
        [Authorize]
        public async Task<ActionResult<LessonReadDto>> GetById(Guid id)
        {
            var lesson = await _lessonSvc.GetByIdAsync(id);
            if (lesson == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("Admin");
            var isInstructor = User.IsInRole("Instructor");
            var isStudent = User.IsInRole("Student");
            var courseId = lesson.CourseId;

            if (!isAdmin)
            {
                if (isInstructor)
                {
                    var course = await _courseSvc.GetByIdAsync(courseId);
                    if (course == null) return NotFound();
                    if (course.InstructorId != userId) return Forbid();
                }
                else if (isStudent)
                {
                    var enrolls = await _enrollSvc.GetAllAsync();
                    if (!enrolls.Any(e => e.CourseId == courseId && e.StudentId == userId))
                        return Forbid();
                }
                else
                {
                    return Forbid();
                }
            }

            return Ok(_mapper.Map<LessonReadDto>(lesson));
        }


        // POST /api/courses/{courseId}/lessons
        [HttpPost("api/courses/{courseId:guid}/lessons")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonReadDto>> Create(
            Guid courseId,
            [FromBody] LessonCreateDto dto)
        {
            // (Optionally, you could also check that the JWT instructorId == course.InstructorId)
            var lesson = _mapper.Map<Lesson>(dto);
            lesson.CourseId = courseId;
            lesson.CreatedAt = DateTime.UtcNow;

            var created = await _lessonSvc.CreateAsync(lesson);
            var result = _mapper.Map<LessonReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // PUT /api/lessons/{id}
        [HttpPut("api/lessons/{id:guid}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] LessonUpdateDto dto)
        {
            var lesson = await _lessonSvc.GetByIdAsync(id);
            if (lesson == null) return NotFound();

            _mapper.Map(dto, lesson);
            await _lessonSvc.UpdateAsync(lesson);
            return NoContent();
        }

        // DELETE /api/lessons/{id}
        [HttpDelete("api/lessons/{id:guid}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _lessonSvc.DeleteAsync(id);
            return NoContent();
        }
    }
}
