using System;
using System.ComponentModel.DataAnnotations;

namespace Tasky.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Color { get; set; } = "#6366f1";

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}