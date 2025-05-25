using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NerdAcademy.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentStatusToEnrollments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EnrollmentStatus",
                table: "Enrollments",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnrollmentStatus",
                table: "Enrollments");
        }
    }
}
