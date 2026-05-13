using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;

namespace Tasky.Controllers
{
    public class TasksController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public TasksController(
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

            var tasks = await _context.Tasks
                .Include(t => t.List)
                    .ThenInclude(l => l!.Board)
                .Where(t =>
                    t.ListId == null &&
                    (
                        t.CreatorId == userId ||
                        t.GuestId == guestId ||
                        (
                            t.List != null &&
                            t.List.Board != null &&
                            t.List.Board.Members.Any(m => m.UserId == userId)
                        )
                    ))
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return View(tasks);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { error = "Title is required" });

            var userId = _userManager.GetUserId(User);
            var guestId = GuestHelper.GetGuestId(HttpContext);

            var task = new TaskItem
            {
                Title = dto.Title.Trim(),
                Description = dto.Description,
                ListId = dto.ListId,
                CreatorId = userId,
                GuestId = guestId,
                Status = "todo",
                Priority = "medium",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (dto.ListId.HasValue)
            {
                var maxPosition = await _context.Tasks
                    .Where(t => t.ListId == dto.ListId)
                    .Select(t => (int?)t.Position)
                    .MaxAsync() ?? 0;

                task.Position = maxPosition + 1;
            }

            _context.Tasks.Add(task);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                task.Id,
                task.Title
            });
        }

        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound();

            return Ok(new
            {
                id = task.Id,
                title = task.Title,
                description = task.Description,
                status = task.Status,
                priority = task.Priority,
                dueDate = task.DueDate,
                assignees = task.Assignees.Select(a => new
                {
                    userId = a.UserId
                })
            });
        }

        [HttpPut]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateTaskDto dto)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound();

            if (dto.Title != null)
                task.Title = dto.Title;

            if (dto.Description != null)
                task.Description = dto.Description;

            if (dto.Status != null)
                task.Status = dto.Status;

            if (dto.Priority != null)
                task.Priority = dto.Priority;

            task.DueDate = dto.DueDate;

            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound();

            _context.Tasks.Remove(task);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost]
        public async Task<IActionResult> Reorder(
    [FromBody] ReorderTasksRequest request)
        {
            if (request == null ||
                request.OrderedTaskIds == null ||
                !request.OrderedTaskIds.Any())
            {
                return BadRequest();
            }

            var tasks = await _context.Tasks
                .Where(t =>
                    request.OrderedTaskIds.Contains(t.Id))
                .ToListAsync();

            for (int i = 0; i < request.OrderedTaskIds.Count; i++)
            {
                var task = tasks.FirstOrDefault(
                    t => t.Id == request.OrderedTaskIds[i]);

                if (task == null)
                    continue;

                task.Position = i;
                task.ListId = request.ListId;
                task.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }
    }
}