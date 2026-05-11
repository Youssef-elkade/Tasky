using System.ComponentModel.DataAnnotations.Schema;

namespace Tasky.Models
{
    public class TaskAssignee
    {
        public int Id { get; set; }

        public int TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public virtual TaskItem? Task { get; set; }

        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}