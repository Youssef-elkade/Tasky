using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tasky.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int? ListId { get; set; }

        [ForeignKey(nameof(ListId))]
        public virtual TaskList? List { get; set; }

        public string? CreatorId { get; set; }

        [ForeignKey(nameof(CreatorId))]
        public virtual User? Creator { get; set; }

        public string? GuestId { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "todo";

        [StringLength(50)]
        public string Priority { get; set; } = "medium";

        public int Position { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<TaskAssignee> Assignees { get; set; }
            = new List<TaskAssignee>();
    }
}