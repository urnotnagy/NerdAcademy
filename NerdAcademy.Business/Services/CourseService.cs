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

        public async Task<Course> CreateAsync(Course course)
        {
            _db.Courses.Add(course);
            await _db.SaveChangesAsync();
            return course;
        }

        public async Task UpdateAsync(Course course)
        {
            _db.Courses.Update(course);
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
