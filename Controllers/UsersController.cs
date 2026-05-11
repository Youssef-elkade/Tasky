using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Models;
using Tasky.ViewModels;

namespace Tasky.Controllers
{
    public class UsersController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;

        public UsersController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            SignInManager<User> signInManager)
        {
            _context = context;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpGet("/Users/Profile/{id?}")]
        public async Task<IActionResult> Index(string? id)
        {
            var currentUserId = _userManager.GetUserId(User);

            var targetUserId =
                string.IsNullOrEmpty(id)
                    ? currentUserId
                    : id;

            if (string.IsNullOrEmpty(targetUserId))
                return RedirectToAction("Login", "Auth");

            var user =
                await _userManager.FindByIdAsync(targetUserId);

            if (user == null)
                return NotFound();

            var isOwn =
                currentUserId == targetUserId;

            var taskCount = await _context.Tasks
                .CountAsync(t => t.CreatorId == targetUserId);

            var boardCount = await _context.Boards
                .CountAsync(b => b.CreatorId == targetUserId);

            var noteCount = await _context.Notes
                .CountAsync(n => n.UserId == targetUserId);

            var model = new UserProfileViewModel
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.UserName ?? "Unknown",
                Email = user.Email ?? "No Email",
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                IsOwnProfile = isOwn,
                TaskCount = taskCount,
                BoardCount = boardCount,
                NoteCount = noteCount
            };

            return View(model);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAjax(
            string id,
            [FromBody] UpdateProfileDto data)
        {
            var currentUserId =
                _userManager.GetUserId(User);

            if (currentUserId != id)
                return Forbid();

            var user =
                await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(data.Name))
                user.Name = data.Name;

            if (!string.IsNullOrWhiteSpace(data.Username))
                user.UserName = data.Username;

            if (!string.IsNullOrWhiteSpace(data.Bio))
                user.Bio = data.Bio;

            await _userManager.UpdateAsync(user);

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> UploadAvatarAjax(
            string id,
            [FromBody] AvatarUploadDto data)
        {
            var currentUserId =
                _userManager.GetUserId(User);

            if (currentUserId != id)
                return Forbid();

            var user =
                await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(data.AvatarUrl))
                user.AvatarUrl = data.AvatarUrl;

            await _userManager.UpdateAsync(user);

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> LogoutAjax()
        {
            await _signInManager.SignOutAsync();

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> ChangePasswordAjax(
            string id,
            [FromBody] ChangePasswordDto data)
        {
            var currentUserId = _userManager.GetUserId(User);

            if (currentUserId != id)
                return Forbid();

            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound();

            
            if (string.IsNullOrWhiteSpace(data.CurrentPassword))
                return BadRequest(new { error = "Current password is required" });

            if (string.IsNullOrWhiteSpace(data.NewPassword))
                return BadRequest(new { error = "New password is required" });

            if (data.NewPassword != data.ConfirmPassword)
                return BadRequest(new { error = "New passwords do not match" });

            if (data.NewPassword.Length < 6)
                return BadRequest(new { error = "Password must be at least 6 characters" });

            
            var result = await _userManager.CheckPasswordAsync(user, data.CurrentPassword);
            if (!result)
                return BadRequest(new { error = "Current password is incorrect" });

            
            var changeResult = await _userManager.ChangePasswordAsync(user, data.CurrentPassword, data.NewPassword);
            if (!changeResult.Succeeded)
            {
                var errors = string.Join(", ", changeResult.Errors.Select(e => e.Description));
                return BadRequest(new { error = errors });
            }

            return Ok(new { message = "Password changed successfully" });
        }
    }

    public class UpdateProfileDto
    {
        public string? Name { get; set; }

        public string? Username { get; set; }

        public string? Bio { get; set; }
    }

    public class AvatarUploadDto
    {
        public string? AvatarUrl { get; set; }
    }
}