using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data.Entities
{
    public class Lesson
    {
        [Key]
        public Guid Id { get; set; }

        // FK
        public Guid CourseId { get; set; }
        public Course Course { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        public string? Content { get; set; }  // Markdown/HTML

        public int DurationInMinutes { get; set; }

        public string? VideoUrl { get; set; }

        public int Order { get; set; }

       public DateTime CreatedAt { get; set; }
    }
}
