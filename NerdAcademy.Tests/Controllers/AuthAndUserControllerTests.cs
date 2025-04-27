
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.API;
using NerdAcademy.API.DTOs;
using NerdAcademy.API.Controllers;
using NerdAcademy.Tests;
using Xunit;

namespace NerdAcademy.Tests.Controllers
{
    public class AuthAndUserControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AuthAndUserControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Register_Login_ShouldReturnJwtToken()
        {
            // Arrange & Act: Register
            var registerResponse = await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = "Test",
                LastName = "User",
                Email = "testuser@example.com",
                Password = "Password123!",
                Role = "Student"
            });
            registerResponse.EnsureSuccessStatusCode();

            // Act: Login
            var loginResponse = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = "testuser@example.com",
                Password = "Password123!"
            });
            loginResponse.EnsureSuccessStatusCode();

            // Assert: JSON contains token
            var payload = await loginResponse.Content.ReadFromJsonAsync<JsonDocument>();
            Assert.True(payload.RootElement.TryGetProperty("token", out var tokenElement));
            Assert.False(string.IsNullOrEmpty(tokenElement.GetString()));
        }

        [Fact]
        public async Task GetUsers_UnauthorizedWithoutToken()
        {
            // Act
            var response = await _client.GetAsync("/api/users");
            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUsers_ForbiddenForStudentRole()
        {
            // Arrange: register & login as Student
            await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = "Stu",
                LastName = "Dent",
                Email = "student@example.com",
                Password = "Password123!",
                Role = "Student"
            });
            var loginResponse = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = "student@example.com",
                Password = "Password123!"
            });
            var loginJson = await loginResponse.Content.ReadFromJsonAsync<JsonDocument>();
            var token = loginJson.RootElement.GetProperty("token").GetString();

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act
            var response = await _client.GetAsync("/api/users");
            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetUsers_SucceedsForAdminRole()
        {
            // Arrange: register & login as Admin
            await _client.PostAsJsonAsync("/api/users/register", new UserCreateDto
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@example.com",
                Password = "Password123!",
                Role = "Admin"
            });
            var loginResponse = await _client.PostAsJsonAsync("/api/users/login", new UserLoginDto
            {
                Email = "admin@example.com",
                Password = "Password123!"
            });
            var loginJson = await loginResponse.Content.ReadFromJsonAsync<JsonDocument>();
            var token = loginJson.RootElement.GetProperty("token").GetString();

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act
            var response = await _client.GetAsync("/api/users");
            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
