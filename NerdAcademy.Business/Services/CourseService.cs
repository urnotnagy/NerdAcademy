using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using NerdAcademy.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Business.Services
{
    public class CourseService : ICourseService
    {
        private readonly AppDbContext _db;
        public CourseService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Course>> GetAllAsync() =>
            await _db.Courses.Include(c => c.Tags)
                             .ToListAsync();

        public async Task<Course> GetByIdAsync(Guid id) =>
            await _db.Courses.Include(c => c.Tags)
                             .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<Course> CreateAsync(Course course, IEnumerable<Guid> tagIds)
        {
            // 1) Ensure only existing tags get attached
            var tags = await _db.Tags
                                .Where(t => tagIds.Contains(t.Id))
                                .ToListAsync();
            course.Tags = tags;

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();
            return course;
        }

        public async Task UpdateAsync(Course course, IEnumerable<Guid> tagIds)
        {
            // 1) Load current course including its Tags nav
            var existing = await _db.Courses
                                    .Include(c => c.Tags)
                                    .FirstOrDefaultAsync(c => c.Id == course.Id);
            if (existing == null) throw new KeyNotFoundException();

            // 2) Update scalar props
            existing.Title = course.Title;
            existing.Description = course.Description;
            existing.Price = course.Price;
            existing.DurationInWeeks = course.DurationInWeeks;
            existing.Level = course.Level;
            existing.Status = course.Status;
          //  existing.InstructorId = course.InstructorId;
            // etc…

            // 3) Refresh tags
            existing.Tags.Clear();
            var tags = await _db.Tags
                                .Where(t => tagIds.Contains(t.Id))
                                .ToListAsync();
            foreach (var tag in tags)
                existing.Tags.Add(tag);

            await _db.SaveChangesAsync();
        }


        public async Task DeleteAsync(Guid id)
        {
            var c = await _db.Courses.FindAsync(id);
            if (c == null) return;
            _db.Courses.Remove(c);
            await _db.SaveChangesAsync();
        }
    }
}
