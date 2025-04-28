namespace NerdAcademy.API.DTOs
{
    // what clients POST to create a new course
    public class CourseCreateDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int DurationInWeeks { get; set; }
        public int Level { get; set; }  // map to enum
        public int Status { get; set; }
        public List<Guid> TagIds { get; set; } = new();
    }

    // what you return to clients on GET/post
    public class CourseReadDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int DurationInWeeks { get; set; }
        public string Level { get; set; }
        public string Status { get; set; }
        public Guid InstructorId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<Guid> TagIds { get; set; }
    }
}
