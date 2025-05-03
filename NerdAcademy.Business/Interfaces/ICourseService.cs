using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Business.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<Course>> GetAllAsync();
        Task<Course> GetByIdAsync(Guid id);
        Task<Course> CreateAsync(Course course, IEnumerable<Guid> tagIds);
        Task UpdateAsync(Course course, IEnumerable<Guid> tagIds);
        Task DeleteAsync(Guid id);
    }
}
