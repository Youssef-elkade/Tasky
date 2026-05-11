using Microsoft.AspNetCore.Http;

namespace Tasky.Helpers
{
    public static class GuestHelper
    {
        public static string GetGuestId(HttpContext context)
        {
            const string cookieName = "TaskyGuestId";

            if (context.Request.Cookies.TryGetValue(cookieName, out var guestId))
            {
                return guestId!;
            }

            guestId = Guid.NewGuid().ToString();

            context.Response.Cookies.Append(
                cookieName,
                guestId,
                new CookieOptions
                {
                    Expires = DateTimeOffset.UtcNow.AddYears(1),
                    HttpOnly = true,
                    IsEssential = true
                });

            return guestId;
        }
    }
}