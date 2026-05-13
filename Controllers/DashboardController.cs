using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tasky.Data;
using Tasky.Helpers;
using Tasky.Models;
using Tasky.ViewModels;

namespace Tasky.Controllers
{
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public DashboardController(
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

            var today = DateTime.UtcNow.Date;
            var in7Days = today.AddDays(7);

            var tasksQuery = _context.Tasks
                .Include(t => t.List)
                .ThenInclude(l => l!.Board)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                tasksQuery = tasksQuery.Where(t =>
                    t.CreatorId == userId ||
                    t.List!.Board!.Members.Any(m => m.UserId == userId));
            }
            else
            {
                tasksQuery = tasksQuery.Where(t =>
                    t.GuestId == guestId);
            }

            var userTasks = await tasksQuery.ToListAsync();

            var boardsQuery = _context.Boards.AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                boardsQuery = boardsQuery.Where(b =>
                    b.CreatorId == userId ||
                    b.Members.Any(m => m.UserId == userId));
            }
            else
            {
                boardsQuery = boardsQuery.Where(b =>
                    b.GuestId == guestId);
            }

            var totalBoards = await boardsQuery.CountAsync();

            var notesQuery = _context.Notes.AsQueryable();

            notesQuery = notesQuery.Where(n =>
                n.UserId == userId ||
                n.GuestId == guestId);

            var totalNotes = await notesQuery.CountAsync();

            var totalTasks = userTasks.Count;

            var completedTasks = userTasks.Count(t =>
                t.Status == "done");

            var overdueTasks = userTasks.Count(t =>
                t.DueDate.HasValue &&
                t.DueDate.Value.Date < today &&
                t.Status != "done" &&
                t.Status != "cancelled");

            var tasksByStatus = userTasks
                .GroupBy(t =>
                    string.IsNullOrEmpty(t.Status)
                        ? "todo"
                        : t.Status)
                .ToDictionary(g => g.Key, g => g.Count());

            var upcomingTasks = userTasks
                .Where(t =>
                    t.DueDate.HasValue &&
                    t.Status != "done" &&
                    t.Status != "cancelled" &&
                    t.DueDate.Value.Date >= today &&
                    t.DueDate.Value.Date <= in7Days)
                .OrderBy(t => t.DueDate)
                .Take(6)
                .ToList();

            var recentTasks = userTasks
                .OrderByDescending(t => t.CreatedAt)
                .Take(6)
                .ToList();

            var listsQuery = _context.Lists.AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                listsQuery = listsQuery.Where(l =>
                    l.BoardId == null ||
                    l.Board!.CreatorId == userId ||
                    l.Board.Members.Any(m => m.UserId == userId));
            }
            else
            {
                listsQuery = listsQuery.Where(l =>
                    l.BoardId == null ||
                    l.Board!.GuestId == guestId);
            }

            var totalLists = await listsQuery.CountAsync();

            var model = new DashboardViewModel
            {
                TotalBoards = totalBoards,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                OverdueTasks = overdueTasks,
                ActiveLists = totalLists,
                TotalNotes = totalNotes,
                TasksByStatus = tasksByStatus,
                UpcomingTasks = upcomingTasks,
                RecentTasks = recentTasks
            };

            return View(model);
        }
    }
}