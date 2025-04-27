using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data.Entities
{
    public class Tag
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        // ← EF Core will scaffold the join table for this
        public ICollection<Course> Courses { get; set; }
    }
}
