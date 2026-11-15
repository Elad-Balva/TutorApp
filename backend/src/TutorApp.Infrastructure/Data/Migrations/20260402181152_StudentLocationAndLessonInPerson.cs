using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class StudentLocationAndLessonInPerson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine",
                table: "Students",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationNotes",
                table: "Students",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInPerson",
                table: "Lessons",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressLine",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "LocationNotes",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "IsInPerson",
                table: "Lessons");
        }
    }
}
