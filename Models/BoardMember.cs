using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tasky.Models
{
    public class BoardMember
    {
        public int Id { get; set; }

        public int BoardId { get; set; }

        [ForeignKey(nameof(BoardId))]
        public virtual Board? Board { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [StringLength(50)]
        public string Role { get; set; } = "Member";

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}