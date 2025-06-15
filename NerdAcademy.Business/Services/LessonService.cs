using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using NerdAcademy.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // Added for logging
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
        private readonly ILogger<LessonService> _logger; // Added for logging

        public LessonService(AppDbContext db, ILogger<LessonService> logger) // Added logger
        {
            _db = db;
            _logger = logger; // Added logger
        }

        public async Task<IEnumerable<Lesson>> GetAllAsync(Guid courseId, Guid userId) // Renamed studentId to userId
        {
            var course = await _db.Courses.Include(c => c.Instructor).FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null)
            {
                _logger.LogWarning("Course with ID {CourseId} not found.", courseId);
                // Depending on requirements, could throw NotFoundException or return empty list.
                // For now, let controller handle it, perhaps by returning 404 if course isn't found.
                // Or, if lessons for a non-existent course should be an empty list and not an error:
                return Enumerable.Empty<Lesson>();
            }

            var user = await _db.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found.", userId);
                // Similar to course, decide on behavior. Throwing an exception might be appropriate.
                throw new UnauthorizedAccessException($"User with ID {userId} not found. Access to lessons denied.");
            }

            _logger.LogInformation("Attempting to access lessons for Course ID {CourseId} by User ID {UserId} with Role {UserRole}.", courseId, userId, user.Role);

            // 1. Admin access
            if (user.Role == UserRole.Admin) // Corrected comparison
            {
                _logger.LogInformation("Access granted to Admin User ID {UserId} for Course ID {CourseId}.", userId, courseId);
                return await _db.Lessons
                                .Where(l => l.CourseId == courseId)
                                .OrderBy(l => l.Order) // Added OrderBy
                                .ToListAsync();
            }

            // 2. Instructor (owner) access
            if (user.Role == UserRole.Instructor && course.InstructorId == userId) // Corrected comparison
            {
                _logger.LogInformation("Access granted to Instructor (owner) User ID {UserId} for Course ID {CourseId}.", userId, courseId);
                return await _db.Lessons
                                .Where(l => l.CourseId == courseId)
                                .OrderBy(l => l.Order) // Added OrderBy
                                .ToListAsync();
            }

            // 3. Student (or other roles requiring enrollment) access
            var enrollment = await _db.Enrollments
                                      .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == userId);

            if (enrollment == null || enrollment.EnrollmentStatus != "Approved")
            {
                _logger.LogWarning("Access denied for User ID {UserId} to Course ID {CourseId}. Enrollment not approved or not found. Enrollment status: {EnrollmentStatus}",
                    userId, courseId, enrollment?.EnrollmentStatus ?? "Not Enrolled");
                throw new UnauthorizedAccessException("Access to lessons denied. Enrollment not approved or not found.");
            }

            _logger.LogInformation("Access granted to enrolled User ID {UserId} for Course ID {CourseId}.", userId, courseId);
            return await _db.Lessons
                            .Where(l => l.CourseId == courseId)
                            .OrderBy(l => l.Order) // Added OrderBy
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
