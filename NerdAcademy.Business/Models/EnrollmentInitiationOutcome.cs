using NerdAcademy.Data.Entities;

namespace NerdAcademy.Business.Models
{
    public enum EnrollmentInitiationStatus
    {
        PendingPayment,
        Enrolled,
        AlreadyEnrolled,
        CourseNotFound,
        Error
    }

    public class EnrollmentInitiationOutcome
    {
        public bool WasSuccessful { get; set; }
        public EnrollmentInitiationStatus Status { get; set; }
        public Payment? PaymentPending { get; set; }
        public Enrollment? EnrollmentCreated { get; set; }
    }
}