namespace NerdAcademy.API.DTOs
{
    public class PaymentCreateDto
    {
        public Guid EnrollmentId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Provider { get; set; }
    }

    public class PaymentUpdateDto
    {
        public int Status { get; set; }
    }

    public class PaymentReadDto
    {
        public Guid Id { get; set; }
        public Guid EnrollmentId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Provider { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Status { get; set; }
    }
}
