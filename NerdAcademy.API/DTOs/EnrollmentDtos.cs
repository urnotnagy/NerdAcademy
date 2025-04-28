namespace NerdAcademy.API.DTOs
{

    public class EnrollmentCreateDto
    {
        public Guid StudentId { get; set; }
        public Guid CourseId { get; set; }
    }

    public class EnrollmentReadDto
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public Guid CourseId { get; set; }
        public DateTime EnrolledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public decimal? Grade { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
