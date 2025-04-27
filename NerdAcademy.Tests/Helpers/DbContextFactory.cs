using System;
using System.Collections.Generic;
using NerdAcademy.Data;
using Microsoft.EntityFrameworkCore;
using System;

namespace NerdAcademy.Tests.Helpers
{
    public static class DbContextFactory
    {
        public static AppDbContext CreateInMemory()
        {
            var opts = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var context = new AppDbContext(opts);

            // optional: seed any lookup data here, e.g. default roles or tags
            // context.Tags.Add(new Tag { ... });
            // context.SaveChanges();

            return context;
        }
    }
}