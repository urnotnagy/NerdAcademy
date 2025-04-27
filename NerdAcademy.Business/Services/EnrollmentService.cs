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
    public class EnrollmentService : IEnrollmentService
    {
        private readonly AppDbContext _db;
        public EnrollmentService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Enrollment>> GetAllAsync() =>
            await _db.Enrollments
                     .Include(e => e.Student)
                     .Include(e => e.Course)
                     .Include(e => e.Payment)
                     .ToListAsync();

        public async Task<Enrollment> GetByIdAsync(Guid id) =>
            await _db.Enrollments
                     .Include(e => e.Student)
                     .Include(e => e.Course)
                     .Include(e => e.Payment)
                     .FirstOrDefaultAsync(e => e.Id == id);

        public async Task<Enrollment> CreateAsync(Enrollment enrollment)
        {
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
    }
}
