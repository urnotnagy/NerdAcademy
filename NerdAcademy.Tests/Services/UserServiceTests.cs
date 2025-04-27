using Microsoft.EntityFrameworkCore;
using NerdAcademy.Tests.Helpers;
using Xunit;
using System;
using System.Threading.Tasks;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.Tests.Services
{
    public class UserServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_User()
        {
            // Arrange
            using var db = DbContextFactory.CreateInMemory();
            var svc = new UserService(db);

            var user = new User
            {
                FirstName = "Jane",
                LastName = "Doe",
                Email = "jane@example.com",
                PasswordHash = "hash",
                PasswordLastUpdated = DateTime.UtcNow,
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var created = await svc.CreateAsync(user);

            // Assert
            Assert.NotEqual(Guid.Empty, created.Id);
            var fetched = await db.Users.FindAsync(created.Id);
            Assert.Equal("jane@example.com", fetched.Email);
        }
    }
}