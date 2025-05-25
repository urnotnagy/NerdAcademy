using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging; // Added for logging
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq; // Added for .Count()
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
        private readonly ILogger<EnrollmentsController> _logger; // Added

        public EnrollmentsController(IEnrollmentService svc, IMapper mapper, ILogger<EnrollmentsController> logger) // Added logger
        {
            _svc = svc;
            _mapper = mapper;
            _logger = logger; // Added
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
            _logger.LogInformation($"EnrollmentService.GetAllAsync() returned {(list == null ? "null" : list.Count().ToString())} items."); // Added logging

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var role = User.FindFirstValue("role");

            // Diagnostic change:
            if (role == "Admin")
            {
                _logger.LogInformation("Admin request: Returning raw list.");
                // Temporarily return the raw list for admins to check if 'list' is populated
                // The frontend might not display this correctly; check the raw network response.
                return Ok(list);
            }
            else
            {
                _logger.LogInformation($"Non-admin request for userId {userId}: Filtering list.");
                // Non-admin path remains the same
                var studentSpecificList = list.Where(e => e.StudentId == userId);
                return Ok(_mapper.Map<EnrollmentReadDto[]>(studentSpecificList));
            }
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

// GET api/enrollments/course/{courseId}
        [HttpGet("course/{courseId:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<EnrollmentReadDto>), 200)]
        [ProducesResponseType(404)] 
        public async Task<ActionResult<IEnumerable<EnrollmentReadDto>>> GetEnrollmentsByCourse(Guid courseId)
        {
            var enrollments = await _svc.GetEnrollmentsByCourseIdAsync(courseId);
            if (enrollments == null || !enrollments.Any())
            {
                // Return an empty list if no enrollments are found, which is often preferred over 404 for collections.
                // A 404 could be used if the courseId itself is invalid, but that check might be better in the service or a separate course check.
                return Ok(new List<EnrollmentReadDto>());
            }
            return Ok(_mapper.Map<IEnumerable<EnrollmentReadDto>>(enrollments));
        }
        // DELETE /api/enrollments/{id}
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(Guid id)
        {
            // 1) fetch the enrollment
            var enrollment = await _svc.GetByIdAsync(id);
            if (enrollment == null)
                return NotFound();

            // 2) check permissions
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var role = User.FindFirstValue("role");
            if (role != "Admin" && enrollment.StudentId != userId)
                return Forbid();

            // 3) delete and return NoContent
            await _svc.DeleteAsync(id);
            return NoContent();
        }

        // GET api/enrollments/manageable
        [HttpGet("manageable")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<EnrollmentReadDto>), 200)]
        public async Task<ActionResult<IEnumerable<EnrollmentReadDto>>> GetManageableEnrollments()
        {
            var manageableEnrollments = await _svc.GetManageableEnrollmentsAsync();
            return Ok(_mapper.Map<IEnumerable<EnrollmentReadDto>>(manageableEnrollments));
        }

        // POST api/enrollments/{id}/status
        [HttpPost("{id:guid}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(EnrollmentReadDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<EnrollmentReadDto>> SetEnrollmentStatus(Guid id, [FromBody] EnrollmentStatusUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
            {
                return BadRequest("Status cannot be empty.");
            }

            try
            {
                var enrollment = await _svc.SetEnrollmentStatusAsync(id, dto.Status);
                if (enrollment == null)
                {
                    return NotFound();
                }
                return Ok(_mapper.Map<EnrollmentReadDto>(enrollment));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST api/enrollments/{id}/approve
        [HttpPost("{id:guid}/approve")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(EnrollmentReadDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<EnrollmentReadDto>> ApproveEnrollment(Guid id)
        {
            var enrollment = await _svc.ApproveEnrollmentAsync(id);
            if (enrollment == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map<EnrollmentReadDto>(enrollment));
        }

        // POST api/enrollments/{id}/reject
        [HttpPost("{id:guid}/reject")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(EnrollmentReadDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<EnrollmentReadDto>> RejectEnrollment(Guid id)
        {
            var enrollment = await _svc.RejectEnrollmentAsync(id);
            if (enrollment == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map<EnrollmentReadDto>(enrollment));
        }
    }
}