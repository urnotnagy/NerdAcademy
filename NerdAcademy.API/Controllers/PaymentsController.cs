using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System.Security.Claims;

namespace NerdAcademy.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentSvc;
        private readonly IEnrollmentService _enrollSvc;
        private readonly IMapper _mapper;

        public PaymentsController(
            IPaymentService paymentSvc,
            IEnrollmentService enrollSvc,
            IMapper mapper)
        {
            _paymentSvc = paymentSvc;
            _enrollSvc = enrollSvc;
            _mapper = mapper;
        }

        // GET /api/payments
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetAll()
        {
            var list = await _paymentSvc.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<PaymentReadDto>>(list));
        }

        // GET /api/payments/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<ActionResult<PaymentReadDto>> GetById(Guid id)
        {
            var pay = await _paymentSvc.GetByIdAsync(id);
            if (pay == null) return NotFound();

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            if (role != "Admin")
            {
                // ensure the payment belongs to this student
                var enrollment = await _enrollSvc.GetByIdAsync(pay.EnrollmentId);
                if (enrollment == null || enrollment.StudentId != userId)
                    return Forbid();
            }

            return Ok(_mapper.Map<PaymentReadDto>(pay));
        }

        // POST /api/payments
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<PaymentReadDto>> Create([FromBody] PaymentCreateDto dto)
        {
            var studentId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // verify enrollment belongs to student
            var enrollment = await _enrollSvc.GetByIdAsync(dto.EnrollmentId);
            if (enrollment == null || enrollment.StudentId != studentId)
                return Forbid();

            var pay = _mapper.Map<Payment>(dto);
            pay.PaymentDate = DateTime.UtcNow;
            pay.Status = PaymentStatus.Pending;

            var created = await _paymentSvc.CreateAsync(pay);
            var result = _mapper.Map<PaymentReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // PUT /api/payments/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PaymentUpdateDto dto)
        {
            var pay = await _paymentSvc.GetByIdAsync(id);
            if (pay == null) return NotFound();

            _mapper.Map(dto, pay);
            await _paymentSvc.UpdateAsync(pay);
            return NoContent();
        }

        // DELETE /api/payments/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _paymentSvc.DeleteAsync(id);
            return NoContent();
        }
    }
}
