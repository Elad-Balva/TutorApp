using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorApp.Infrastructure.backend.src.TutorApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpectedDurationToLessons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedDurationInHours",
                table: "Lessons",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 1.00m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpectedDurationInHours",
                table: "Lessons");
        }
    }
}
