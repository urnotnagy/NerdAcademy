using NerdAcademy.Business.Services;
using NerdAcademy.Data.Entities;
using NerdAcademy.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace NerdAcademy.Tests.Services
{
    public class TagServiceTests
    {
        [Fact]
        public async Task CreateAsync_Should_Add_New_Tag()
        {
            using var db = DbContextFactory.CreateInMemory();
            var svc = new TagService(db);

            var tag = new Tag { Name = "CSharp" };
            var created = await svc.CreateAsync(tag);

            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal("CSharp", db.Tags.Single().Name);
        }

        [Fact]
        public async Task GetAllAsync_Should_Return_All_Tags()
        {
            using var db = DbContextFactory.CreateInMemory();
            db.Tags.AddRange(new Tag { Name = "A" }, new Tag { Name = "B" });
            await db.SaveChangesAsync();
            var svc = new TagService(db);

            var all = await svc.GetAllAsync();

            Assert.Equal(2, all.Count());
        }
    }
}