using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class StudentJoinedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "JoinedAt",
                table: "Students",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JoinedAt",
                table: "Students");
        }
    }
}
