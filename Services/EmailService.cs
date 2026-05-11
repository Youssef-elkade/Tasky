using System.Net;
using System.Net.Mail;

namespace Tasky.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var smtp = new SmtpClient(_configuration["Email:Smtp"])
            {
                Port = int.Parse(_configuration["Email:Port"]!),
                Credentials = new NetworkCredential(
                    _configuration["Email:Username"],
                    _configuration["Email:Password"]),
                EnableSsl = true
            };

            var message = new MailMessage
            {
                From = new MailAddress(_configuration["Email:Username"]!),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(to);

            await smtp.SendMailAsync(message);
        }
    }
}