using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class ListsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public ListsController(
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

            var lists = await _context.Lists
                .Include(l => l.Board)
                    .ThenInclude(b => b!.Members)
                .Include(l => l.Tasks.OrderBy(t => t.Position))
                .Where(l =>
                    l.BoardId == null ||
                    (
                        l.Board != null &&
                        (
                            l.Board.CreatorId == userId ||
                            l.Board.GuestId == guestId ||
                            l.Board.Members.Any(m => m.UserId == userId)
                        )
                    ))
                .OrderBy(l => l.Position)
                .ToListAsync();

            return View(lists);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(
            [Bind("Title,BoardId,Color")]
            TaskList newList)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == newList.BoardId);

            if (board == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                board.CreatorId == userId ||
                board.GuestId == guestId ||
                board.Members.Any(m => m.UserId == userId);

            if (!hasAccess)
                return Forbid();

            if (ModelState.IsValid)
            {
                var listCount = await _context.Lists
                    .CountAsync(l => l.BoardId == newList.BoardId);

                newList.Position = listCount;
                newList.CreatedAt = DateTime.UtcNow;
                newList.UpdatedAt = DateTime.UtcNow;

                _context.Lists.Add(newList);

                await _context.SaveChangesAsync();

                return RedirectToAction(
                    "Details",
                    "Boards",
                    new { id = newList.BoardId });
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> CreateAjax(
            [FromBody] CreateListDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest();

            if (dto.BoardId != null)
            {
                var board = await _context.Boards
                    .Include(b => b.Members)
                    .FirstOrDefaultAsync(b => b.Id == dto.BoardId);

                if (board == null)
                    return NotFound();

                var userId = _userManager.GetUserId(User);
                var guestId = GuestHelper.GetGuestId(HttpContext);

                var hasAccess =
                    board.CreatorId == userId ||
                    board.GuestId == guestId ||
                    board.Members.Any(m => m.UserId == userId);

                if (!hasAccess)
                    return Forbid();
            }

            var listCount = await _context.Lists
                .CountAsync(l => l.BoardId == dto.BoardId);

            var newList = new TaskList
            {
                Title = dto.Title,
                BoardId = dto.BoardId,
                Position = listCount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Lists.Add(newList);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = newList.Id,
                title = newList.Title
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAjax(
            int id,
            [FromBody] TaskList data)
        {
            var list = await _context.Lists
                .Include(l => l.Board)
                    .ThenInclude(b => b!.Members)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (list == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                list.Board != null &&
                (
                    list.Board.CreatorId == userId ||
                    list.Board.GuestId == guestId ||
                    list.Board.Members.Any(m => m.UserId == userId)
                );

            if (!hasAccess)
                return Forbid();

            list.Title = data.Title;
            list.Color = data.Color;
            list.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = list.Id,
                title = list.Title
            });
        }

        [HttpDelete("/Lists/DeleteAjax/{id}")]
        public async Task<IActionResult> DeleteAjax(int id)
        {
            var list = await _context.Lists
                .Include(l => l.Board)
                    .ThenInclude(b => b!.Members)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (list == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                list.BoardId == null ||
                (
                    list.Board != null &&
                    (
                        list.Board.CreatorId == userId ||
                        list.Board.GuestId == guestId ||
                        list.Board.Members.Any(m => m.UserId == userId)
                    )
                );

            if (!hasAccess)
                return Forbid();

            _context.Lists.Remove(list);

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> Reorder(
            [FromBody] ReorderListsDto dto)
        {
            if (dto == null || dto.OrderedIds == null)
                return BadRequest();

            var lists = await _context.Lists
                .Where(l => dto.OrderedIds.Contains(l.Id))
                .ToListAsync();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            foreach (var list in lists)
            {
                if (list.BoardId == null)
                    continue;

                var board = await _context.Boards
                    .Include(b => b.Members)
                    .FirstOrDefaultAsync(
                        b => b.Id == list.BoardId
                    );

                if (board == null)
                    continue;

                var hasAccess =
                    board.CreatorId == userId ||
                    board.GuestId == guestId ||
                    (
                        board.Members != null &&
                        board.Members.Any(
                            m => m.UserId == userId
                        )
                    );

                if (!hasAccess)
                    return Forbid();
            }

            for (int i = 0; i < dto.OrderedIds.Count; i++)
            {
                var list = lists.FirstOrDefault(
                    l => l.Id == dto.OrderedIds[i]
                );

                if (list != null)
                    list.Position = i;
            }

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}