using System;
using System.Linq;
using System.Threading.Tasks;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests.Helpers;
using Xunit;

namespace NerdAcademy.Tests.Services
{
    public class EnrollmentServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_Enrollment()
        {
            using var db = DbContextFactory.CreateInMemory();
            // seed user & course
            var user = new User { FirstName = "U", LastName = "N", Email = "u@n", PasswordHash = "h", Role = UserRole.Student, CreatedAt = DateTime.UtcNow };
            var course = new Course { Title = "C", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            var svc = new EnrollmentService(db);
            var enroll = new Enrollment
            {
                StudentId = user.Id,
                CourseId = course.Id,
                EnrolledAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            var created = await svc.CreateAsync(enroll);

            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal(user.Id, db.Enrollments.Single().StudentId);
        }

        [Fact]
        public async Task GetAllAsync_Should_Include_Navigation()
        {
            using var db = DbContextFactory.CreateInMemory();
            var user = new User { FirstName = "U", LastName = "N", Email = "u@n", PasswordHash = "h", Role = UserRole.Student, CreatedAt = DateTime.UtcNow };
            var course = new Course { Title = "C", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            db.Enrollments.Add(new Enrollment
            {
                StudentId = user.Id,
                CourseId = course.Id,
                EnrolledAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var svc = new EnrollmentService(db);
            var list = await svc.GetAllAsync();

            Assert.Single(list);
            Assert.NotNull(list.First().Student);
            Assert.NotNull(list.First().Course);
        }
    }
}