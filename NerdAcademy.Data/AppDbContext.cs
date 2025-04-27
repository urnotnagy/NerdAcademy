using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NerdAcademy.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Payment> Payments { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            // only configure if no options have been passed in
            if (!options.IsConfigured)
            {
                var conn = _config.GetConnectionString("DefaultConnection");
                options.UseSqlite(
                    conn,
                    sql => sql.MigrationsAssembly("NerdAcademy.Data")
                );
            }
        }

        private readonly IConfiguration _config;

        public AppDbContext(
            DbContextOptions<AppDbContext> options,
            IConfiguration configuration)
            : base(options)
        {
            _config = configuration;
        }
        public AppDbContext(DbContextOptions<AppDbContext> options)
    : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder model)
        {
            // One-to-one Payment ↔ Enrollment
            model.Entity<Enrollment>()
                 .HasOne(e => e.Payment)
                 .WithOne(p => p.Enrollment)
                 .HasForeignKey<Payment>(p => p.EnrollmentId);

            // No need to configure Course↔Tag: EF Core 5+ will auto-create the join table
        }
    }
}
