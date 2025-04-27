using System;
using System.Linq;
using System.Threading.Tasks;
using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests.Helpers;
using Xunit;

namespace NerdAcademy.Tests.Services
{
    public class LessonServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_Lesson()
        {
            using var db = DbContextFactory.CreateInMemory();
            // seed a course
            var course = new Course { Title = "C", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Courses.Add(course);
            await db.SaveChangesAsync();

            var svc = new LessonService(db);
            var lesson = new Lesson
            {
                CourseId = course.Id,
                Title = "L1",
                Content = "Content",
                DurationInMinutes = 10,
                Order = 1,
                CreatedAt = DateTime.UtcNow
            };
            var created = await svc.CreateAsync(lesson);

            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal("L1", db.Lessons.Single().Title);
        }

        [Fact]
        public async Task GetAllAsync_ByCourseId_Should_Return_Only_That_Course()
        {
            using var db = DbContextFactory.CreateInMemory();
            var c1 = new Course { Title = "C1", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            var c2 = new Course { Title = "C2", InstructorId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
            db.Courses.AddRange(c1, c2);
            await db.SaveChangesAsync();

            db.Lessons.AddRange(
                new Lesson { CourseId = c1.Id, Title = "A", CreatedAt = DateTime.UtcNow },
                new Lesson { CourseId = c2.Id, Title = "B", CreatedAt = DateTime.UtcNow }
            );
            await db.SaveChangesAsync();

            var svc = new LessonService(db);
            var list = await svc.GetAllAsync(c1.Id);

            Assert.Single(list);
            Assert.Equal("A", list.First().Title);
        }
    }
}
