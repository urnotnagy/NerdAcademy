using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests;

namespace NerdAcademy.Tests.Controllers
{
    public class CoursesControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public CoursesControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        private async Task<string> GetTokenAsync(string role, string email)
        {
            await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = role,
                LastName = "User",
                Email = email,
                Password = "Password123!",
                Role = role
            });
            var loginResponse = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = email,
                Password = "Password123!"
            });
            var loginJson = await loginResponse.Content.ReadFromJsonAsync<JsonDocument>();
            return loginJson.RootElement.GetProperty("token").GetString();
        }

        [Fact]
        public async Task GetAll_Unauthenticated_Succeeds()
        {
            var res = await _client.GetAsync("/api/courses");
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        }

        [Fact]
        public async Task Create_AsInstructor_Debug()
        {
            // ─── 1) Register an Instructor & get token ────────────────────────
            var reg = await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = "Instr",
                LastName = "Test",
                Email = "instr.debug@example.com",
                Password = "Password123!",
                Role = "Instructor"
            });
            reg.EnsureSuccessStatusCode();
            var login = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = "instr.debug@example.com",
                Password = "Password123!"
            });
            login.EnsureSuccessStatusCode();
            var tokenJson = await login.Content.ReadFromJsonAsync<JsonDocument>();
            var token = tokenJson.RootElement.GetProperty("token").GetString();
            Assert.False(string.IsNullOrEmpty(token));

            // attach token
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            // ─── 2) Sanity-check GET /api/courses ───────────────────────────────
            var list = await _client.GetAsync("/api/courses");
            Assert.Equal(HttpStatusCode.OK, list.StatusCode);

            // ─── 3) POST a CourseCreateDto, not the entity ─────────────────────
            var createDto = new CourseCreateDto
            {
                Title = "Debug Course",
                Description = "Testing",
                Price = 0,
                DurationInWeeks = 1,
                Level = (int)CourseLevel.Beginner,
                Status = (int)CourseStatus.Draft,
                TagIds = new System.Collections.Generic.List<Guid>()
            };
            var createResp = await _client.PostAsJsonAsync("/api/courses", createDto);

            // if it’s not 201, dump the body
            if (createResp.StatusCode != HttpStatusCode.Created)
            {
                var err = await createResp.Content.ReadAsStringAsync();
                throw new Exception($"Expected 201 but got {createResp.StatusCode}, body:\n{err}");
            }

            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

            // ─── 4) Read back as CourseReadDto ─────────────────────────────────
            var createdDto = await createResp.Content
                                 .ReadFromJsonAsync<CourseReadDto>();
            Assert.NotNull(createdDto);
            Assert.Equal("Debug Course", createdDto.Title);
            Assert.Equal("Beginner", createdDto.Level);
        }

    }
}
