namespace Tasky.Models
{
    public class ReorderTasksRequest
    {
        public int ListId { get; set; }

        public List<int> OrderedTaskIds { get; set; }
            = new();
    }
}