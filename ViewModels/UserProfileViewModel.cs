using Tasky.Models;

namespace Tasky.ViewModels
{
    public class UserProfileViewModel
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsOwnProfile { get; set; }
        public int TaskCount { get; set; }
        public int BoardCount { get; set; }
        public int NoteCount { get; set; }
    }

    public class ChangePasswordDto
    {
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmPassword { get; set; }
    }
}
