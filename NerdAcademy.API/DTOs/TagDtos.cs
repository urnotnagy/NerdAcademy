namespace NerdAcademy.API.DTOs
{
    // what clients POST
    public class TagCreateDto
    {
        public string Name { get; set; }
    }

    // what clients PUT
    public class TagUpdateDto
    {
        public string Name { get; set; }
    }

    // what clients GET
    public class TagReadDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}
