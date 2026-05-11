using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tasky.Models
{
    public class Board
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [StringLength(20)]
        public string Color { get; set; } = "#3B82F6";

        public bool IsCollective { get; set; }

        public string? CreatorId { get; set; }

        [ForeignKey(nameof(CreatorId))]
        public virtual User? Creator { get; set; }

        public string? GuestId { get; set; }

        public int? CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public virtual Category? Category { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Position { get; set; }

        public virtual ICollection<TaskList> Lists { get; set; }
            = new List<TaskList>();

        public virtual ICollection<BoardMember> Members { get; set; }
            = new List<BoardMember>();
    }
}