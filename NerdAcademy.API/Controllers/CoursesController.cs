
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NerdAcademy.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _svc;
        private readonly IMapper _mapper;

        public CoursesController(ICourseService svc, IMapper mapper)
        {
            _svc = svc;
            _mapper = mapper;
        }

        // POST /api/courses
        [HttpPost, Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseReadDto>> Create(CourseCreateDto dto)
        {
            // 1) get instructorId from JWT sub claim
            var instructorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // 2) map dto → entity
            var course = _mapper.Map<Course>(dto);
            course.InstructorId = instructorId;
            course.CreatedAt = DateTime.UtcNow;

            // 3) handle tags join
            if (dto.TagIds.Any())
            {
                course.Tags = dto.TagIds
                    .Select(id => new Tag { Id = id })
                    .ToList();
            }

            // 4) save
            var created = await _svc.CreateAsync(course);

            // 5) return read dto
            var resultDto = _mapper.Map<CourseReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
        }

        // GET /api/courses
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<CourseReadDto[]>> GetAll()
        {
            var list = await _svc.GetAllAsync();
            return Ok(_mapper.Map<CourseReadDto[]>(list));
        }

        // GET /api/courses/{id}
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseReadDto>> GetById(Guid id)
        {
            var c = await _svc.GetByIdAsync(id);
            if (c == null) return NotFound();
            return Ok(_mapper.Map<CourseReadDto>(c));
        }

        // only Instructor or Admin can update
        [HttpPut("{id:guid}"), Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(Guid id, Course course)
        {
            if (id != course.Id) return BadRequest();
            await _svc.UpdateAsync(course);
            return NoContent();
        }

        // only Instructor or Admin can delete
        [HttpDelete("{id:guid}"), Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _svc.DeleteAsync(id);
            return NoContent();
        }
    }
}
