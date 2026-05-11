using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class BoardMembersController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public BoardMembersController(
            ApplicationDbContext context,
            UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(
    int boardId,
    string identifier)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound();

            var currentUserId = _userManager.GetUserId(User);

            var owner = board.Members.FirstOrDefault(m =>
                m.UserId == currentUserId &&
                string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase));

            if (owner == null)
                return Forbid();

            var normalized = identifier.Trim().ToLower();

            var user = await _userManager.Users
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == normalized ||
                    u.UserName.ToLower() == normalized);

            if (user == null)
            {
                return RedirectToAction(
                    "Details",
                    "Boards",
                    new { id = boardId });
            }

            if (user.Id == currentUserId)
            {
                return RedirectToAction(
                    "Details",
                    "Boards",
                    new { id = boardId });
            }

            var alreadyExists = board.Members.Any(m =>
                m.UserId == user.Id);

            if (!alreadyExists)
            {
                var member = new BoardMember
                {
                    BoardId = boardId,
                    UserId = user.Id,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow
                };

                _context.BoardMembers.Add(member);

                await _context.SaveChangesAsync();
            }

            return RedirectToAction(
                "Details",
                "Boards",
                new { id = boardId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Remove(int boardId, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound();

            var currentUserId = _userManager.GetUserId(User);

            var owner = board.Members.FirstOrDefault(m =>
                m.UserId == currentUserId &&
                string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase));

            if (owner == null)
                return Forbid();

            var member = board.Members.FirstOrDefault(m =>
                m.UserId == userId);

            if (member == null)
                return NotFound();

            if (string.Equals(member.Role, "owner", StringComparison.OrdinalIgnoreCase))
                return BadRequest();

            _context.BoardMembers.Remove(member);

            await _context.SaveChangesAsync();

            return RedirectToAction(
                "Details",
                "Boards",
                new { id = boardId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangeRole(
            int boardId,
            string userId,
            string role)
        {
            role = role.ToLowerInvariant();
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound();

            var currentUserId = _userManager.GetUserId(User);

            var owner = board.Members.FirstOrDefault(m =>
                m.UserId == currentUserId &&
                string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase));

            if (owner == null)
                return Forbid();

            var member = board.Members.FirstOrDefault(m =>
                m.UserId == userId);

            if (member == null)
                return NotFound();

            if (string.Equals(member.Role, "owner", StringComparison.OrdinalIgnoreCase))
                return BadRequest();

            if (role != "member" && role != "admin")
                return BadRequest();

            member.Role = role;

            await _context.SaveChangesAsync();

            return RedirectToAction(
                "Details",
                "Boards",
                new { id = boardId });
        }
    }
}
