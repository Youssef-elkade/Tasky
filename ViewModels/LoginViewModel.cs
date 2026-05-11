using System.ComponentModel.DataAnnotations;

namespace Tasky.ViewModels
{
    public class LoginViewModel
    {
        [Required]
        public string EmailOrUsername { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; }
    }
}