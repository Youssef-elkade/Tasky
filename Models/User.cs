using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Tasky.Models
{
    public class User : IdentityUser
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        [StringLength(50)]
        public string Theme { get; set; } = "default";
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? ResetPasswordOtp { get; set; }
        public DateTime? ResetPasswordOtpExpiry { get; set; }
        public virtual ICollection<BoardMember> BoardMemberships { get; set; }
            = new List<BoardMember>();
        public virtual ICollection<TaskAssignee> TaskAssignments { get; set; }
            = new List<TaskAssignee>();
        public virtual ICollection<Board> CreatedBoards { get; set; }
            = new List<Board>();
        public virtual ICollection<TaskItem> CreatedTasks { get; set; }
            = new List<TaskItem>();
        public virtual ICollection<Note> Notes { get; set; }
            = new List<Note>();
    }
}