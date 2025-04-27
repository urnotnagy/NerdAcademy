using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data.Entities
{
    public enum CourseLevel { Beginner, Intermediate, Advanced }
    public enum CourseStatus { Draft, Published, Archived }

    public class Course
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; }

        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public int DurationInWeeks { get; set; }

        public CourseLevel Level { get; set; }

        public CourseStatus Status { get; set; }

        // FK to User
        public Guid InstructorId { get; set; }
        public User Instructor { get; set; }

        public DateTime CreatedAt { get; set; }

        // ← EF Core skip-nav: auto join table CourseTag(CourseId,TagId)
        public ICollection<Tag> Tags { get; set; }

        public ICollection<Lesson> Lessons { get; set; }
        public ICollection<Enrollment> Enrollments { get; set; }
    }
}
