namespace NerdAcademy.API.DTOs
{
    public class LessonCreateDto
    {
        public string Title { get; set; }
        public string? Content { get; set; }
        public int DurationInMinutes { get; set; }
        public int Order { get; set; }
        public string? VideoUrl { get; set; }
    }

    public class LessonReadDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public string Title { get; set; }
        public string? Content { get; set; }
        public int DurationInMinutes { get; set; }
        public string? VideoUrl { get; set; }
        public int Order { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LessonUpdateDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public int? DurationInMinutes { get; set; }
        public int? Order { get; set; }
        public string? VideoUrl { get; set; }
    }

}
