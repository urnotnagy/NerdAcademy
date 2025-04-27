using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests.Helpers;
using Xunit;

namespace NerdAcademy.Tests.Services
{
    public class CourseServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_Course()
        {
            using var db = DbContextFactory.CreateInMemory();
            var svc = new CourseService(db);

            var course = new Course
            {
                Title = "Test",
                Description = "Desc",
                Price = 0,
                DurationInWeeks = 1,
                Level = CourseLevel.Beginner,
                Status = CourseStatus.Draft,
                InstructorId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            };
            var created = await svc.CreateAsync(course);

            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal("Test", (await db.Courses.FindAsync(created.Id)).Title);
        }

        [Fact]
        public async Task GetAllAsync_Should_Include_Tags()
        {
            using var db = DbContextFactory.CreateInMemory();
            var tag = new Tag { Name = "X" };
            var course = new Course
            {
                Title = "T",
                InstructorId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            };
            db.Tags.Add(tag);
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            // associate tag
            db.Entry(course).Collection(c => c.Tags).Load();
            course.Tags.Add(tag);
            await db.SaveChangesAsync();

            var svc = new CourseService(db);
            var list = await svc.GetAllAsync();

            Assert.Single(list);
            Assert.Single(list.First().Tags);
        }
    }
}
