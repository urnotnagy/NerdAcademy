using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using NerdAcademy.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
// Removed: using NerdAcademy.API.DTOs;
// Removed: using AutoMapper;

namespace NerdAcademy.Business.Services
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly AppDbContext _db;
        // Removed: private readonly IMapper _mapper;

        // Updated constructor
        public EnrollmentService(AppDbContext db) // Removed IMapper
        {
            _db = db;
        }

        public async Task<IEnumerable<Enrollment>> GetAllAsync() =>
            await _db.Enrollments
                     .Include(e => e.Student)
                     .Include(e => e.Course)
                     .Include(e => e.Payment)
                     .ToListAsync();

        public async Task<Enrollment?> GetByIdAsync(Guid id) => // Return type changed to Enrollment?
            await _db.Enrollments
                     .Include(e => e.Student)
                     .Include(e => e.Course)
                     .Include(e => e.Payment)
                     .FirstOrDefaultAsync(e => e.Id == id);

        public async Task<Enrollment> CreateAsync(Enrollment enrollment)
        {
            enrollment.EnrollmentStatus = "Pending";
            _db.Enrollments.Add(enrollment);
            await _db.SaveChangesAsync();
            return enrollment;
        }

        public async Task UpdateAsync(Enrollment enrollment)
        {
            _db.Enrollments.Update(enrollment);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var e = await _db.Enrollments.FindAsync(id);
            if (e == null) return;
            _db.Enrollments.Remove(e);
            await _db.SaveChangesAsync();
        }

        // New methods implementation using Entities
        public async Task<IEnumerable<Enrollment>> GetPendingEnrollmentsAsync()
        {
            return await _db.Enrollments
                .Where(e => e.EnrollmentStatus == "Pending")
                .Include(e => e.Student)
                .Include(e => e.Course)
                .ToListAsync();
        }

        public async Task<Enrollment?> ApproveEnrollmentAsync(Guid enrollmentId)
        {
            var enrollment = await _db.Enrollments
                                      .Include(e => e.Student)
                                      .Include(e => e.Course)
                                      .FirstOrDefaultAsync(e => e.Id == enrollmentId);
            if (enrollment == null)
            {
                return null;
            }

            enrollment.EnrollmentStatus = "Approved";
            await _db.SaveChangesAsync();
            return enrollment; // Return entity
        }

        public async Task<Enrollment?> RejectEnrollmentAsync(Guid enrollmentId)
        {
            var enrollment = await _db.Enrollments
                                      .Include(e => e.Student)
                                      .Include(e => e.Course)
                                      .FirstOrDefaultAsync(e => e.Id == enrollmentId);
            if (enrollment == null)
            {
                return null;
            }

            enrollment.EnrollmentStatus = "Rejected";
            await _db.SaveChangesAsync();
            return enrollment; // Return entity
        }

        public async Task<Enrollment?> SetEnrollmentStatusAsync(Guid enrollmentId, string newStatus)
        {
            var allowedStatuses = new List<string> { "Pending", "Approved", "Rejected" };
            if (!allowedStatuses.Contains(newStatus))
            {
                throw new ArgumentException($"Invalid enrollment status: {newStatus}. Allowed statuses are: {string.Join(", ", allowedStatuses)}");
            }

            var enrollment = await _db.Enrollments
                                      .Include(e => e.Student)
                                      .Include(e => e.Course)
                                      .FirstOrDefaultAsync(e => e.Id == enrollmentId);
            if (enrollment == null)
            {
                return null;
            }

            enrollment.EnrollmentStatus = newStatus;
            await _db.SaveChangesAsync();
            return enrollment;
        }

        public async Task<IEnumerable<Enrollment>> GetManageableEnrollmentsAsync()
        {
            var manageableStatuses = new List<string> { "Pending", "Approved", "Rejected" };
            return await _db.Enrollments
                .Where(e => manageableStatuses.Contains(e.EnrollmentStatus))
                .Include(e => e.Student)
                .Include(e => e.Course)
                .ToListAsync();
        }
public async Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseIdAsync(Guid courseId)
        {
            return await _db.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.Student)
                .Include(e => e.Course)
                .ToListAsync();
        }
    }
}
