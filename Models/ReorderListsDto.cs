namespace Tasky.Models
{
    public class ReorderListsDto
    {
        public int? BoardId { get; set; }
        public List<int> OrderedIds { get; set; }
            = new();
    }
}