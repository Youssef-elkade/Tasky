using Tasky.Models;

namespace Tasky.ViewModels
{
    public class DashboardViewModel
    {
        public int TotalBoards { get; set; }

        public int TotalTasks { get; set; }

        public int CompletedTasks { get; set; }

        public int OverdueTasks { get; set; }

        public int ActiveLists { get; set; }

        public int TotalNotes { get; set; }

        public Dictionary<string, int> TasksByStatus { get; set; } = new();

        public List<TaskItem> UpcomingTasks { get; set; } = new();

        public List<TaskItem> RecentTasks { get; set; } = new();
    }
}