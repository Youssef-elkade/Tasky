namespace Tasky.Models
{
    public class CreateListDto
    {
        public string Title { get; set; } = string.Empty;
        public int? BoardId { get; set; }
    }
}