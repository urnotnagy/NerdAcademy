using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NerdAcademy.Data.Entities
{
    public enum PaymentStatus { Pending, Completed, Failed }

    public class Payment
    {
        [Key]
        public Guid Id { get; set; }

        // FK
        public Guid EnrollmentId { get; set; }
        public Enrollment Enrollment { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; }

        [MaxLength(50)]
        public string Provider { get; set; }  // e.g. Stripe, PayPal

        public DateTime PaymentDate { get; set; }

        public PaymentStatus Status { get; set; }
    }
}
