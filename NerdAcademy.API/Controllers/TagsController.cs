using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NerdAcademy.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _svc;
        private readonly IMapper _mapper;

        public TagsController(ITagService svc, IMapper mapper)
        {
            _svc = svc;
            _mapper = mapper;
        }

        // GET /api/tags
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TagReadDto>>> GetAll()
        {
            var tags = await _svc.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<TagReadDto>>(tags));
        }

        // GET /api/tags/{id}
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<TagReadDto>> GetById(Guid id)
        {
            var tag = await _svc.GetByIdAsync(id);
            if (tag == null) return NotFound();
            return Ok(_mapper.Map<TagReadDto>(tag));
        }

        // POST /api/tags
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(TagReadDto), 201)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<TagReadDto>> Create([FromBody] TagCreateDto dto)
        {
            var entity = _mapper.Map<Tag>(dto);
            var created = await _svc.CreateAsync(entity);
            var result = _mapper.Map<TagReadDto>(created);

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // PUT /api/tags/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(Guid id, [FromBody] TagUpdateDto dto)
        {
            var existing = await _svc.GetByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing);
            await _svc.UpdateAsync(existing);
            return NoContent();
        }

        // DELETE /api/tags/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _svc.DeleteAsync(id);
            return NoContent();
        }
    }
}