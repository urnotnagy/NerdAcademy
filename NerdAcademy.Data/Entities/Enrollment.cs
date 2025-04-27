using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data.Entities
{
    public class Enrollment
    {
        [Key]
        public Guid Id { get; set; }

        // FKs
        public Guid StudentId { get; set; }
        public User Student { get; set; }

        public Guid CourseId { get; set; }
        public Course Course { get; set; }

        public DateTime EnrolledAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        [Range(0, 100)]
        public decimal? Grade { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation
        public Payment Payment { get; set; }
    }
}
