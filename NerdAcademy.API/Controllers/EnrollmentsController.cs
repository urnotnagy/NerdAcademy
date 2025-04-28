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
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly IEnrollmentService _svc;
        private readonly IMapper _mapper;

        public EnrollmentsController(IEnrollmentService svc, IMapper mapper)
        {
            _svc = svc;
            _mapper = mapper;
        }

        // Student enrolls themselves
        [HttpPost, Authorize(Roles = "Student")]
        [ProducesResponseType(typeof(EnrollmentReadDto), 201)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<EnrollmentReadDto>> Create([FromBody] EnrollmentCreateDto dto)
        {
            // override studentId from JWT
            var studentId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (dto.StudentId != studentId)
                return Forbid();

            var entity = _mapper.Map<Enrollment>(dto);
            entity.StudentId = studentId;
            entity.EnrolledAt = DateTime.UtcNow;
            entity.CreatedAt = DateTime.UtcNow;

            var created = await _svc.CreateAsync(entity);
            var result = _mapper.Map<EnrollmentReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // Any authenticated user can list their own; Admin can list all
        [HttpGet]
        [ProducesResponseType(typeof(EnrollmentReadDto[]), 200)]
        public async Task<ActionResult<EnrollmentReadDto[]>> GetAll()
        {
            var list = await _svc.GetAllAsync();
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var role = User.FindFirstValue("role");

            var filtered = role == "Admin"
                ? list
                : list.Where(e => e.StudentId == userId);

            return Ok(_mapper.Map<EnrollmentReadDto[]>(filtered));
        }

        // Only Owner or Admin can view
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(EnrollmentReadDto), 200)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<EnrollmentReadDto>> GetById(Guid id)
        {
            var e = await _svc.GetByIdAsync(id);
            if (e == null) return NotFound();

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var role = User.FindFirstValue("role");

            if (role != "Admin" && e.StudentId != userId)
                return Forbid();

            return Ok(_mapper.Map<EnrollmentReadDto>(e));
        }
    }
}