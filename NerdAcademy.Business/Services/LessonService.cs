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
    public class LessonService : ILessonService
    {
        private readonly AppDbContext _db;
        public LessonService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Lesson>> GetAllAsync(Guid courseId) =>
            await _db.Lessons
                     .Where(l => l.CourseId == courseId)
                     .ToListAsync();

        public async Task<Lesson> GetByIdAsync(Guid id) =>
            await _db.Lessons.FindAsync(id);

        public async Task<Lesson> CreateAsync(Lesson lesson)
        {
            _db.Lessons.Add(lesson);
            await _db.SaveChangesAsync();
            return lesson;
        }

        public async Task UpdateAsync(Lesson lesson)
        {
            _db.Lessons.Update(lesson);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var l = await _db.Lessons.FindAsync(id);
            if (l == null) return;
            _db.Lessons.Remove(l);
            await _db.SaveChangesAsync();
        }
    }
}
