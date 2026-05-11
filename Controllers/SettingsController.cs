using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class SettingsController : Controller
    {
        private readonly UserManager<User> _userManager;

        public SettingsController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<IActionResult> Index()
        {
            
            var user = await _userManager.GetUserAsync(User);
            return View(user);
        }

        
        [HttpPut]
        public async Task<IActionResult> UpdateThemeAjax([FromBody] ThemeDto data)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user != null && !string.IsNullOrEmpty(data.ThemeId))
            {
                
                
                
            }

            return Ok();
        }
    }

    public class ThemeDto
    {
        public string? ThemeId { get; set; }
    }
}