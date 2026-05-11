using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class NotesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public NotesController(
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

            var notes = await _context.Notes
                .Where(n =>
                    n.UserId == userId ||
                    n.GuestId == guestId)
                .OrderByDescending(n => n.IsPinned)
                .ThenByDescending(n => n.CreatedAt)
                .ToListAsync();

            return View(notes);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAjax([FromBody] NoteDto data)
        {
            var note = new Note
            {
                Title = data.Title ?? "",
                Content = data.Content ?? "",
                Color = data.Color ?? "#ffffff",
                IsPinned = data.IsPinned ?? false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var userId = _userManager.GetUserId(User);

            if (userId != null)
                note.UserId = userId;
            else
                note.GuestId = GuestHelper.GetGuestId(HttpContext);

            _context.Notes.Add(note);

            await _context.SaveChangesAsync();

            return Ok(note);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAjax(int id, [FromBody] NoteDto data)
        {
            var note = await _context.Notes.FindAsync(id);

            if (note == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                note.UserId == userId ||
                note.GuestId == guestId;

            if (!hasAccess)
                return Forbid();

            if (data.Title != null)
                note.Title = data.Title;

            if (data.Content != null)
                note.Content = data.Content;

            if (data.Color != null)
                note.Color = data.Color;

            if (data.IsPinned.HasValue)
                note.IsPinned = data.IsPinned.Value;

            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(note);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAjax(int id)
        {
            var note = await _context.Notes.FindAsync(id);

            if (note == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var hasAccess =
                note.UserId == userId ||
                note.GuestId == guestId;

            if (!hasAccess)
                return Forbid();

            _context.Notes.Remove(note);

            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class NoteDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Color { get; set; }
        public bool? IsPinned { get; set; }
    }
}