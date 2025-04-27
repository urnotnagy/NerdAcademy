using Microsoft.EntityFrameworkCore;
using NerdAcademy.Business.Interfaces;
using NerdAcademy.Data.Entities;
using NerdAcademy.Data;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Business.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        public UserService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<User>> GetAllAsync() =>
            await _db.Users.ToListAsync();

        public async Task<User> GetByIdAsync(Guid id) =>
            await _db.Users.FindAsync(id);

        public async Task<User> CreateAsync(User user)
        {
            // enforce unique email
            if (await _db.Users.AnyAsync(u => u.Email == user.Email))
                throw new InvalidOperationException("Email already in use.");

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task UpdateAsync(User user)
        {
            _db.Users.Update(user);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var u = await _db.Users.FindAsync(id);
            if (u == null) return;
            u.IsActive = false;
            await _db.SaveChangesAsync();
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await _db.Users
                .SingleOrDefaultAsync(u => u.Email == email && u.IsActive);
            if (user == null) return null;

            // verify hash
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            var hashString = Convert.ToBase64String(hash);

            return user.PasswordHash == hashString
                ? user
                : null;
        }
    }
}
