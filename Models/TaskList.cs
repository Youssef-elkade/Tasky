using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tasky.Models
{
    public class TaskList
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        public string Color { get; set; } = "#ffffff";

        public int Position { get; set; }

        public int? BoardId { get; set; }

        [ForeignKey(nameof(BoardId))]
        public virtual Board? Board { get; set; }

        public DateTime CreatedAt { get; set; }
            = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; }
            = DateTime.UtcNow;

        public virtual ICollection<TaskItem> Tasks { get; set; }
            = new List<TaskItem>();
    }
}