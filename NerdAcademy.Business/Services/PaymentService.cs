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
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        public PaymentService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Payment>> GetAllAsync() =>
            await _db.Payments
                     .Include(p => p.Enrollment)
                     .ToListAsync();

        public async Task<Payment> GetByIdAsync(Guid id) =>
            await _db.Payments
                     .Include(p => p.Enrollment)
                     .FirstOrDefaultAsync(p => p.Id == id);

        public async Task<Payment> CreateAsync(Payment payment)
        {
            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
            return payment;
        }

        public async Task UpdateAsync(Payment payment)
        {
            _db.Payments.Update(payment);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var p = await _db.Payments.FindAsync(id);
            if (p == null) return;
            _db.Payments.Remove(p);
            await _db.SaveChangesAsync();
        }
    }
}
