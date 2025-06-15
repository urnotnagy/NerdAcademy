using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Business.Interfaces
{
    public interface IEnrollmentService
    {
        Task<IEnumerable<Enrollment>> GetAllAsync();
        Task<Enrollment?> GetByIdAsync(Guid id); // Changed to Enrollment? to allow null
        Task<Enrollment> CreateAsync(Enrollment enrollment);
        Task UpdateAsync(Enrollment enrollment);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Enrollment>> GetPendingEnrollmentsAsync(); // Returns IEnumerable<Enrollment>
        Task<Enrollment?> ApproveEnrollmentAsync(Guid enrollmentId); // Returns Enrollment?
        Task<Enrollment?> RejectEnrollmentAsync(Guid enrollmentId); // Returns Enrollment?
        Task<Enrollment?> SetEnrollmentStatusAsync(Guid enrollmentId, string newStatus);
        Task<IEnumerable<Enrollment>> GetManageableEnrollmentsAsync();
        Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseIdAsync(Guid courseId);
    }
}
