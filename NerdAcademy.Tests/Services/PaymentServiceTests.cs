using System;
using System.Linq;
using System.Threading.Tasks;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests.Helpers;
using Xunit;

namespace NerdAcademy.Tests.Services
{
    public class PaymentServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_Payment()
        {
            using var db = DbContextFactory.CreateInMemory();
            // seed enrollment
            var user = new User { FirstName = "U", LastName = "N", Email = "u@n", PasswordHash = "h", Role = UserRole.Student, CreatedAt = DateTime.UtcNow };
            var course = new Course { Title = "C", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            var enroll = new Enrollment { StudentId = user.Id, CourseId = course.Id, EnrolledAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
            db.Enrollments.Add(enroll);
            await db.SaveChangesAsync();

            var svc = new PaymentService(db);
            var payment = new Payment
            {
                EnrollmentId = enroll.Id,
                Amount = 100m,
                Currency = "USD",
                Provider = "Stripe",
                PaymentDate = DateTime.UtcNow,
                Status = PaymentStatus.Completed
            };
            var created = await svc.CreateAsync(payment);

            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal(100m, db.Payments.Single().Amount);
        }

        [Fact]
        public async Task GetAllAsync_Should_Include_Enrollment()
        {
            using var db = DbContextFactory.CreateInMemory();
            var user = new User { FirstName = "U", LastName = "N", Email = "u@n", PasswordHash = "h", Role = UserRole.Student, CreatedAt = DateTime.UtcNow };
            var course = new Course { Title = "C", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            var enroll = new Enrollment { StudentId = user.Id, CourseId = course.Id, EnrolledAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
            db.Enrollments.Add(enroll);
            await db.SaveChangesAsync();

            db.Payments.Add(new Payment
            {
                EnrollmentId = enroll.Id,
                Amount = 50m,
                Currency = "EUR",
                Provider = "PayPal",
                PaymentDate = DateTime.UtcNow,
                Status = PaymentStatus.Pending
            });
            await db.SaveChangesAsync();

            var svc = new PaymentService(db);
            var list = await svc.GetAllAsync();

            Assert.Single(list);
            Assert.NotNull(list.First().Enrollment);
        }
    }
}
