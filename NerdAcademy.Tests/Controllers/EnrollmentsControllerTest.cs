using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;
using Xunit;

namespace NerdAcademy.Tests.Controllers
{
    public class EnrollmentsControllerTests
        : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public EnrollmentsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Helper now returns a tuple, no out parameter
        private async Task<(string token, Guid userId)> RegisterAndGetTokenAsync(string role)
        {
            var regResp = await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = role,
                LastName = "Test",
                Email = $"{role.ToLower()}{Guid.NewGuid():N}@example.com",
                Password = "Password123!",
                Role = role
            });
            regResp.EnsureSuccessStatusCode();
            var created = await regResp.Content.ReadFromJsonAsync<UserReadDto>();
            var userId = created.Id;

            var loginResp = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = created.Email,
                Password = "Password123!"
            });
            loginResp.EnsureSuccessStatusCode();
            var loginJson = await loginResp.Content.ReadFromJsonAsync<JsonDocument>();
            var token = loginJson.RootElement.GetProperty("token").GetString();

            return (token, userId);
        }

        private async Task<Guid> CreateCourseAsync(string token)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var createDto = new CourseCreateDto
            {
                Title = "Enroll Test",
                Description = "For enroll test",
                Price = 0,
                DurationInWeeks = 1,
                Level = (int)CourseLevel.Beginner,
                Status = (int)CourseStatus.Published,
                TagIds = Array.Empty<Guid>().ToList()
            };

            var resp = await _client.PostAsJsonAsync("/api/courses", createDto);
            resp.EnsureSuccessStatusCode();
            var created = await resp.Content.ReadFromJsonAsync<CourseReadDto>();
            return created.Id;
        }

        [Fact]
        public async Task Create_Unauthorized_401()
        {
            var resp = await _client.PostAsJsonAsync("/api/enrollments", new EnrollmentCreateDto
            {
                StudentId = Guid.NewGuid(),
                CourseId = Guid.NewGuid()
            });
            Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        }

        [Fact]
        public async Task Create_AsAdmin_403()
        {
            var (adminToken, adminId) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var resp = await _client.PostAsJsonAsync("/api/enrollments", new EnrollmentCreateDto
            {
                StudentId = adminId,
                CourseId = Guid.NewGuid()
            });
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        [Fact]
        public async Task Debug_TokenSubClaim_EqualsRegisteredUserId()
        {
            // 1) Register & login
            var (token, userId) = await RegisterAndGetTokenAsync("Student");

            // 2) Decode the raw JWT
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);

            // 3) Pull out the 'sub' claim
            var subClaim = jwt.Claims
                .FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;

            // 4) Assert it matches the userId
            Assert.Equal(userId.ToString(), subClaim);
        }


        [Fact]
        public async Task Create_AsStudent_And_GetAll_And_GetById_Succeeds()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var createDto = new EnrollmentCreateDto
            {
                StudentId = studentId,
                CourseId = courseId
            };
            var createResp = await _client.PostAsJsonAsync("/api/enrollments", createDto);
            createResp.EnsureSuccessStatusCode();
            var enrolled = await createResp.Content.ReadFromJsonAsync<EnrollmentReadDto>();

            var listResp = await _client.GetAsync("/api/enrollments");
            listResp.EnsureSuccessStatusCode();
            var list = await listResp.Content.ReadFromJsonAsync<EnrollmentReadDto[]>();
            Assert.Contains(list, e => e.Id == enrolled.Id);

            var getResp = await _client.GetAsync($"/api/enrollments/{enrolled.Id}");
            Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        }

        [Fact]
        public async Task GetById_OtherStudent_403()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (token1, student1) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token1);

            var createDto = new EnrollmentCreateDto
            {
                StudentId = student1,
                CourseId = courseId
            };
            var createResp = await _client.PostAsJsonAsync("/api/enrollments", createDto);
            createResp.EnsureSuccessStatusCode();
            var enrolled = await createResp.Content.ReadFromJsonAsync<EnrollmentReadDto>();

            var (token2, _) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token2);

            var getResp = await _client.GetAsync($"/api/enrollments/{enrolled.Id}");
            Assert.Equal(HttpStatusCode.Forbidden, getResp.StatusCode);
        }
    }
}