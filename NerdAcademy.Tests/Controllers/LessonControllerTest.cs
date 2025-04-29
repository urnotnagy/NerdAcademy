using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace NerdAcademy.Tests.Controllers
{
    public class LessonsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public LessonsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        private async Task<string> GetTokenAsync(string role)
        {
            var reg = await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = role,
                LastName = "User",
                Email = $"{role.ToLower()}{Guid.NewGuid():N}@example.com",
                Password = "Password123!",
                Role = role
            });
            reg.EnsureSuccessStatusCode();
            var login = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = (await reg.Content.ReadFromJsonAsync<UserReadDto>()).Email,
                Password = "Password123!"
            });
            login.EnsureSuccessStatusCode();
            return (await login.Content.ReadFromJsonAsync<JsonDocument>())
                   .RootElement.GetProperty("token").GetString();
        }

        private async Task<Guid> CreateCourseAsync(string token)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var dto = new CourseCreateDto
            {
                Title = "LsnTest",
                Description = "Desc",
                Price = 0,
                DurationInWeeks = 1,
                Level = (int)CourseLevel.Beginner,
                Status = (int)CourseStatus.Published,
                TagIds = Array.Empty<Guid>().ToList()
            };
            var res = await _client.PostAsJsonAsync("/api/courses", dto);
            res.EnsureSuccessStatusCode();
            return (await res.Content.ReadFromJsonAsync<CourseReadDto>()).Id;
        }

        [Fact]
        public async Task GetByCourse_Anonymous_Ok()
        {
            var fakeCourseId = Guid.NewGuid();
            var res = await _client.GetAsync($"/api/courses/{fakeCourseId}/lessons");
            // empty set or NotFound? we treat as OK with [].
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        }

        [Fact]
        public async Task Create_Unauthenticated_Unauthorized()
        {
            var lesson = new LessonCreateDto
            {
                Title = "L1",
                Content = "C",
                DurationInMinutes = 10,
                Order = 1
            };
            var res = await _client.PostAsJsonAsync($"/api/courses/{Guid.NewGuid()}/lessons", lesson);
            Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        }

        [Fact]
        public async Task Create_AsStudent_Forbidden()
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", await GetTokenAsync("Student"));

            var lesson = new LessonCreateDto
            {
                Title = "L1",
                Content = "C",
                DurationInMinutes = 10,
                Order = 1
            };
            var res = await _client.PostAsJsonAsync($"/api/courses/{Guid.NewGuid()}/lessons", lesson);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        [Fact]
        public async Task Create_AsInstructor_Created()
        {
            var instrToken = await GetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", instrToken);

            var lessonDto = new LessonCreateDto
            {
                Title = "L1",
                Content = "C",
                DurationInMinutes = 10,
                Order = 1
            };
            var res = await _client.PostAsJsonAsync($"/api/courses/{courseId}/lessons", lessonDto);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);

            var created = await res.Content.ReadFromJsonAsync<LessonReadDto>();
            Assert.Equal("L1", created.Title);
            Assert.Equal(courseId, created.CourseId);
        }

        [Fact]
        public async Task Update_AsInstructor_NoContent()
        {
            var instrToken = await GetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", instrToken);

            // create
            var lessonDto = new LessonCreateDto { Title = "A", Content = "C", DurationInMinutes = 5, Order = 1 };
            var create = await _client.PostAsJsonAsync($"/api/courses/{courseId}/lessons", lessonDto);
            var created = await create.Content.ReadFromJsonAsync<LessonReadDto>();

            // update
            var updateDto = new LessonUpdateDto { Title = "B", Content = null, DurationInMinutes = null, Order = null };
            var res = await _client.PutAsJsonAsync($"/api/lessons/{created.Id}", updateDto);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

            // verify
            var get = await _client.GetAsync($"/api/lessons/{created.Id}");
            var fetched = await get.Content.ReadFromJsonAsync<LessonReadDto>();
            Assert.Equal("B", fetched.Title);
        }

        [Fact]
        public async Task Delete_AsInstructor_NoContent()
        {
            var instrToken = await GetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", instrToken);

            var lessonDto = new LessonCreateDto { Title = "X", Content = "C", DurationInMinutes = 5, Order = 1 };
            var create = await _client.PostAsJsonAsync($"/api/courses/{courseId}/lessons", lessonDto);
            var created = await create.Content.ReadFromJsonAsync<LessonReadDto>();

            var res = await _client.DeleteAsync($"/api/lessons/{created.Id}");
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

            var get = await _client.GetAsync($"/api/lessons/{created.Id}");
            Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
        }
    }
}
