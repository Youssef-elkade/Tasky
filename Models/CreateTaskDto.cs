namespace Tasky.Models
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int? ListId { get; set; }
    }
}