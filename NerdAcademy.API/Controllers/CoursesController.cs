
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
            var instructorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var course = _mapper.Map<Course>(dto);
            course.InstructorId = instructorId;
            course.CreatedAt = DateTime.UtcNow;

            // pass dto.TagIds into service instead of new Tag {Id}
            var created = await _svc.CreateAsync(course, dto.TagIds);

            var resultDto = _mapper.Map<CourseReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
        }

        // PUT /api/courses/{id}
        [HttpPut("{id:guid}"), Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] CourseUpdateDto dto)
        {
            // load the DTO into a Course instance for scalar props
            var course = _mapper.Map<Course>(dto);
            course.Id = id;

            // delegate to service, passing the TagIds
            await _svc.UpdateAsync(course, dto.TagIds);
            return NoContent();
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





        // DELETE /api/courses/{id}
        [HttpDelete("{id:guid}"), Authorize(Roles = "Instructor,Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var existing = await _svc.GetByIdAsync(id);
            if (existing == null)
                return NotFound();

            await _svc.DeleteAsync(id);
            return NoContent();
        }
    }
}
