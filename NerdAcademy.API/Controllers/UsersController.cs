using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using NerdAcademy.API.DTOs;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;


namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _svc;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;


        public UsersController(IUserService svc, IMapper mapper, IConfiguration config)
        {
            _svc = svc;
            _mapper = mapper;
            _config = config;
        }

        [HttpGet, Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserReadDto>>> GetAll()
        {
            var users = await _svc.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<UserReadDto>>(users));
        }

        [HttpGet("{id:guid}")]
        [Authorize]           
        public async Task<ActionResult<UserReadDto>> GetById(Guid id)
        {
            var user = await _svc.GetByIdAsync(id);
            if (user == null) return NotFound();

            // who is calling?
            var callerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var callerRole = User.FindFirstValue(ClaimTypes.Role);

            // if not admin AND not asking for their own record → FORBID
            if (callerRole != "Admin" && callerId != id)
                return Forbid();

            return Ok(_mapper.Map<UserReadDto>(user));
        }

        [HttpPost("register"), AllowAnonymous]
        public async Task<ActionResult<UserReadDto>> Register(UserCreateDto dto)
        {
            var user = _mapper.Map<User>(dto);
            user.Id = Guid.NewGuid();
            user.IsActive = true;
            user.CreatedAt = DateTime.UtcNow;
            user.PasswordLastUpdated = DateTime.UtcNow;

            // hash password
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));
            user.PasswordHash = Convert.ToBase64String(hash);

            try
            {
                var created = await _svc.CreateAsync(user);
                var result = _mapper.Map<UserReadDto>(created);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Email already in use"))
            {
                // 409 Conflict on duplicate email
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpPost("login"), AllowAnonymous]
        public async Task<IActionResult> Login(UserLoginDto dto)
        {
            var user = await _svc.AuthenticateAsync(dto.Email, dto.Password);
            if (user == null)
                return Unauthorized(new { error = "Invalid credentials" });

            // build token
            var jwtCfg = _config.GetSection("Jwt");
            var keyBytes = Encoding.UTF8.GetBytes(jwtCfg["Key"]);
            var creds = new SigningCredentials(
                                new SymmetricSecurityKey(keyBytes),
                                SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("role", user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

            var token = new JwtSecurityToken(
                issuer: jwtCfg["Issuer"],
                audience: jwtCfg["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                            double.Parse(jwtCfg["ExpiresInMinutes"])),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                expires = token.ValidTo
            });
        }

        [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, UserUpdateDto dto)
        {
            var existing = await _svc.GetByIdAsync(id);
            if (existing == null) return NotFound();

            _mapper.Map(dto, existing);
            await _svc.UpdateAsync(existing);
            return NoContent();
        }

        [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _svc.DeleteAsync(id);
            return NoContent();
        }
    }
}
