using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class CanvasesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public CanvasesController(
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

            var canvases = await _context.Canvases
                .Where(c =>
                    c.UserId == userId ||
                    c.GuestId == guestId)
                .OrderBy(c => c.SortOrder)
                .ThenByDescending(c => c.UpdatedAt)
                .ToListAsync();

            return View(canvases);
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var canvas = await _context.Canvases
                .FirstOrDefaultAsync(m => m.Id == id);

            if (canvas == null)
            {
                return NotFound();
            }

            var userId = _userManager.GetUserId(User);

            var guestId = GuestHelper.GetGuestId(HttpContext);

            if (
                canvas.UserId != userId &&
                canvas.GuestId != guestId
            )
            {
                return Forbid();
            }

            return View(canvas);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAjax(
            [FromBody] CanvasDto data)
        {
            var userId = _userManager.GetUserId(User);

            var guestId = GuestHelper.GetGuestId(HttpContext);

            int nextSortOrder = await _context.Canvases
                .Where(c =>
                    c.UserId == userId ||
                    c.GuestId == guestId)
                .Select(c => (int?)c.SortOrder)
                .MaxAsync() ?? 0;

            var canvas = new Canvas
            {
                Title = string.IsNullOrWhiteSpace(data.Title)
                    ? ""
                    : data.Title,

                SortOrder = nextSortOrder + 1,

                CreatedAt = DateTime.UtcNow,

                UpdatedAt = DateTime.UtcNow
            };

            if (userId != null)
            {
                canvas.UserId = userId;
            }
            else
            {
                canvas.GuestId = guestId;
            }

            _context.Canvases.Add(canvas);

            await _context.SaveChangesAsync();

            return Ok(canvas);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAjax(
            int id,
            [FromBody] CanvasDto data)
        {
            var canvas = await _context.Canvases.FindAsync(id);

            if (canvas == null)
            {
                return NotFound();
            }

            var userId = _userManager.GetUserId(User);

            var guestId = GuestHelper.GetGuestId(HttpContext);

            if (
                canvas.UserId != userId &&
                canvas.GuestId != guestId
            )
            {
                return Forbid();
            }

            if (data.Title != null)
            {
                canvas.Title = data.Title;
            }

            if (data.Content != null)
            {
                canvas.Content = data.Content;
            }

            canvas.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(canvas);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAjax(int id)
        {
            var canvas = await _context.Canvases.FindAsync(id);

            if (canvas != null)
            {
                var userId = _userManager.GetUserId(User);

                var guestId = GuestHelper.GetGuestId(HttpContext);

                if (
                    canvas.UserId != userId &&
                    canvas.GuestId != guestId
                )
                {
                    return Forbid();
                }

                _context.Canvases.Remove(canvas);

                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> ReorderAjax(
            [FromBody] List<int> orderedIds)
        {
            var userId = _userManager.GetUserId(User);

            var guestId = GuestHelper.GetGuestId(HttpContext);

            var canvases = await _context.Canvases
                .Where(c =>
                    orderedIds.Contains(c.Id) &&
                    (
                        c.UserId == userId ||
                        c.GuestId == guestId
                    ))
                .ToListAsync();

            for (int i = 0; i < orderedIds.Count; i++)
            {
                var canvas = canvases
                    .FirstOrDefault(c => c.Id == orderedIds[i]);

                if (canvas != null)
                {
                    canvas.SortOrder = i + 1;
                }
            }

            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class CanvasDto
    {
        public string? Title { get; set; }

        public string? Content { get; set; }
    }
}