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
using System.Security.Claims;


namespace NerdAcademy.Tests.Controllers
{
    public class PaymentsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public PaymentsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        private async Task<(string token, Guid userId)> RegisterAndGetTokenAsync(string role)
        {
            var regResponse = await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = role,
                LastName = "Test",
                Email = $"{role.ToLower()}{Guid.NewGuid():N}@example.com",
                Password = "Password123!",
                Role = role
            });
            regResponse.EnsureSuccessStatusCode();
            var created = await regResponse.Content.ReadFromJsonAsync<UserReadDto>();
            var userId = created.Id;

            var loginResponse = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = created.Email,
                Password = "Password123!"
            });
            loginResponse.EnsureSuccessStatusCode();
            var doc = await loginResponse.Content.ReadFromJsonAsync<JsonDocument>();
            var token = doc.RootElement.GetProperty("token").GetString();

            return (token, userId);
        }

        private async Task<Guid> CreateCourseAsync(string token)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var dto = new CourseCreateDto
            {
                Title = "Payment Course",
                Description = "For payments",
                Price = 10,
                DurationInWeeks = 1,
                Level = (int)CourseLevel.Beginner,
                Status = (int)CourseStatus.Published,
                TagIds = Array.Empty<Guid>().ToList()
            };

            var response = await _client.PostAsJsonAsync("/api/courses", dto);
            response.EnsureSuccessStatusCode();
            var created = await response.Content.ReadFromJsonAsync<CourseReadDto>();
            return created.Id;
        }

        private async Task<Guid> EnrollStudentAsync(string studentToken, Guid studentId, Guid courseId)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var dto = new EnrollmentCreateDto
            {
                StudentId = studentId,
                CourseId = courseId
            };

            var response = await _client.PostAsJsonAsync("/api/enrollments", dto);
            response.EnsureSuccessStatusCode();
            var created = await response.Content.ReadFromJsonAsync<EnrollmentReadDto>();
            return created.Id;
        }

        private async Task<Guid> CreatePaymentAsync(string token, Guid enrollmentId)
        {
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var dto = new PaymentCreateDto
            {
                EnrollmentId = enrollmentId,
                Amount = 99.99m,
                Currency = "USD",
                Provider = "Stripe"
            };

            var response = await _client.PostAsJsonAsync("/api/payments", dto);
            response.EnsureSuccessStatusCode();
            var created = await response.Content.ReadFromJsonAsync<PaymentReadDto>();
            return created.Id;
        }

        [Fact]
        public async Task Create_Unauthenticated_Returns401()
        {
            var response = await _client.PostAsJsonAsync("/api/payments", new PaymentCreateDto
            {
                EnrollmentId = Guid.NewGuid(),
                Amount = 10,
                Currency = "USD",
                Provider = "Test"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Create_AsAdmin_ReturnsForbidden()
        {
            var (adminToken, adminId) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await _client.PostAsJsonAsync("/api/payments", new PaymentCreateDto
            {
                EnrollmentId = Guid.NewGuid(),
                Amount = 10,
                Currency = "USD",
                Provider = "Test"
            });
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Create_AsStudentWithInvalidEnrollment_ReturnsForbidden()
        {
            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.PostAsJsonAsync("/api/payments", new PaymentCreateDto
            {
                EnrollmentId = Guid.NewGuid(),
                Amount = 10,
                Currency = "USD",
                Provider = "Test"
            });
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Create_AsStudent_Succeeds()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);

            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);
            Assert.NotEqual(Guid.Empty, paymentId);
        }

        [Fact]
        public async Task GetAll_AsStudent_ReturnsForbidden()
        {
            var (studentToken, _) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.GetAsync("/api/payments");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetAll_AsAdmin_ReturnsOk()
        {
            var (adminToken, _) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await _client.GetAsync("/api/payments");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetById_AsStudentOwn_ReturnsOk()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.GetAsync($"/api/payments/{paymentId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetById_AsStudentOther_ReturnsForbidden()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (token1, student1) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(token1, student1, courseId);
            var paymentId = await CreatePaymentAsync(token1, enrollmentId);
            


            var (token2, _) = await RegisterAndGetTokenAsync("Student");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token2);



            var response = await _client.GetAsync($"/api/payments/{paymentId}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetById_AsAdmin_ReturnsOk()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            var (adminToken, _) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await _client.GetAsync($"/api/payments/{paymentId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Update_AsStudent_ReturnsForbidden()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.PutAsJsonAsync($"/api/payments/{paymentId}", new PaymentUpdateDto { Status = (int)PaymentStatus.Completed });
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Update_AsAdmin_Succeeds()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            var (adminToken, _) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await _client.PutAsJsonAsync($"/api/payments/{paymentId}", new PaymentUpdateDto { Status = (int)PaymentStatus.Completed });
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task Delete_AsStudent_ReturnsForbidden()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.DeleteAsync($"/api/payments/{paymentId}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Delete_AsAdmin_Succeeds()
        {
            var (instrToken, _) = await RegisterAndGetTokenAsync("Instructor");
            var courseId = await CreateCourseAsync(instrToken);

            var (studentToken, studentId) = await RegisterAndGetTokenAsync("Student");
            var enrollmentId = await EnrollStudentAsync(studentToken, studentId, courseId);
            var paymentId = await CreatePaymentAsync(studentToken, enrollmentId);

            var (adminToken, _) = await RegisterAndGetTokenAsync("Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await _client.DeleteAsync($"/api/payments/{paymentId}");
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
    }
}

