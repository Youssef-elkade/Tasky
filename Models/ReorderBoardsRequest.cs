namespace Tasky.Models
{
    public class ReorderBoardsRequest
    {
        public List<int> OrderedIds { get; set; } = new();
    }
}
