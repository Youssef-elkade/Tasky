using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class BoardsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public BoardsController(
            ApplicationDbContext context,
            UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index()
        {
            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            IQueryable<Board> query;

            if (!string.IsNullOrEmpty(userId))
            {
                query = _context.Boards
                    .Include(b => b.Category)
                    .Include(b => b.Members)
                        .ThenInclude(m => m.User)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Tasks)
                    .Where(b =>
                        b.CreatorId == userId ||
                        b.Members.Any(m => m.UserId == userId));
            }
            else
            {
                query = _context.Boards
                    .Include(b => b.Category)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Tasks)
                    .Where(b => b.GuestId == guestId);
            }

            var boards = await query
                .OrderBy(b => b.Position)
                    .ThenByDescending(b => b.UpdatedAt)
                .ToListAsync();

            return View(boards);
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
                return NotFound();

            var board = await _context.Boards
                .Include(b => b.Category)
                .Include(b => b.Lists)
                    .ThenInclude(l => l.Tasks)
                .Include(b => b.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (board == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            if (board.IsCollective)
            {
                if (!User.Identity!.IsAuthenticated)
                    return RedirectToAction("Login", "Auth");

                var isMember = board.Members.Any(m => m.UserId == userId);

                if (!isMember)
                    return Forbid();
            }
            else
            {
                var hasAccess =
                    board.CreatorId == userId ||
                    board.GuestId == guestId;

                if (!hasAccess)
                    return Forbid();
            }

            board.Lists = board.Lists
                .OrderBy(l => l.Position)
                .ToList();

            foreach (var list in board.Lists)
            {
                list.Tasks = list.Tasks
                    .OrderBy(t => t.Position)
                    .ToList();
            }

            return View(board);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(
    Board board,
    string? membersEmails)
        {
            if (!ModelState.IsValid)
                return RedirectToAction(nameof(Index));

            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var userId = _userManager.GetUserId(User);

                if (string.IsNullOrEmpty(userId))
                {
                    board.GuestId =
                        GuestHelper.GetGuestId(HttpContext);

                    board.IsCollective = false;
                }
                else
                {
                    board.CreatorId = userId;
                }

                board.CreatedAt = DateTime.UtcNow;
                board.UpdatedAt = DateTime.UtcNow;

                _context.Boards.Add(board);

                await _context.SaveChangesAsync();

                if (board.IsCollective &&
                    !string.IsNullOrEmpty(userId))
                {
                    var owner = new BoardMember
                    {
                        BoardId = board.Id,
                        UserId = userId,
                        Role = "owner",
                        JoinedAt = DateTime.UtcNow
                    };

                    _context.BoardMembers.Add(owner);

                    if (!string.IsNullOrWhiteSpace(membersEmails))
                    {
                        var emails = membersEmails
                            .Split(',', StringSplitOptions.RemoveEmptyEntries);

                        foreach (var email in emails)
                        {
                            var trimmedEmail = email.Trim();

                            var user = await _userManager.Users
                                .FirstOrDefaultAsync(u =>
                                    u.Email == trimmedEmail);

                            if (user == null)
                                continue;

                            if (user.Id == userId)
                                continue;

                            var exists =
                                await _context.BoardMembers.AnyAsync(m =>
                                    m.BoardId == board.Id &&
                                    m.UserId == user.Id);

                            if (exists)
                                continue;

                            var member = new BoardMember
                            {
                                BoardId = board.Id,
                                UserId = user.Id,
                                Role = "member",
                                JoinedAt = DateTime.UtcNow
                            };

                            _context.BoardMembers.Add(member);
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return RedirectToAction(nameof(Index));
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (board == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                board.CreatorId == userId ||
                board.GuestId == guestId;

            if (!hasAccess)
                return Forbid();

            _context.Boards.Remove(board);

            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Reorder(
    [FromBody] ReorderBoardsRequest request)
        {
            var userId = _userManager.GetUserId(User);

            var boards = await _context.Boards
                .Where(b =>
                    request.OrderedIds.Contains(b.Id) &&
                    (
                        b.CreatorId == userId ||
                        b.Members.Any(m => m.UserId == userId)
                    )
                )
                .ToListAsync();

            for (int i = 0; i < request.OrderedIds.Count; i++)
            {
                var board = boards.FirstOrDefault(
                    b => b.Id == request.OrderedIds[i]);

                if (board != null)
                    board.Position = i;
            }

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}