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

        public async Task<IEnumerable<Lesson>> GetAllAsync(Guid courseId, Guid studentId)
        {
            // Check if the student is enrolled and approved for this course
            var enrollment = await _db.Enrollments
                                      .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);

            if (enrollment == null || enrollment.EnrollmentStatus != "Approved")
            {
                // Or throw a custom exception, e.g., throw new UnauthorizedAccessException("Student is not approved for this course.");
                // Returning an empty list might be preferred if the controller handles it by returning 404 or an empty response.
                // For now, let's throw an exception to make it clear in the controller.
                throw new UnauthorizedAccessException("Access to lessons denied. Enrollment not approved or not found.");
            }

            return await _db.Lessons
                            .Where(l => l.CourseId == courseId)
                            .ToListAsync();
        }

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
