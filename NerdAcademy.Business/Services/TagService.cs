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
    public class TagService : ITagService
    {
        private readonly AppDbContext _db;
        public TagService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Tag>> GetAllAsync() =>
            await _db.Tags.ToListAsync();

        public async Task<Tag> GetByIdAsync(Guid id) =>
            await _db.Tags.FindAsync(id);

        public async Task<Tag> CreateAsync(Tag tag)
        {
            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();
            return tag;
        }

        public async Task UpdateAsync(Tag tag)
        {
            _db.Tags.Update(tag);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var t = await _db.Tags.FindAsync(id);
            if (t == null) return;
            _db.Tags.Remove(t);
            await _db.SaveChangesAsync();
        }
    }
}
