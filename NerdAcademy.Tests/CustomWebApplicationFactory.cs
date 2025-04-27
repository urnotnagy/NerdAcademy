using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NerdAcademy.API;
using NerdAcademy.Data;

namespace NerdAcademy.Tests
{
    public class CustomWebApplicationFactory
      : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // 1. Remove the real AppDbContext registration
                var descriptor = services
                  .SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // 2. Add AppDbContext using InMemory for testing
                services.AddDbContext<AppDbContext>(opts =>
                {
                    opts.UseInMemoryDatabase("TestDb");
                });

                // 3. Build the service provider and ensure DB is created
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();
            });
        }
    }
}

