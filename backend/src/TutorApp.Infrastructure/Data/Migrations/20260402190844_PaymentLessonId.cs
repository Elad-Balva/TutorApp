using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class PaymentLessonId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LessonId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_LessonId",
                table: "Payments",
                column: "LessonId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Lessons_LessonId",
                table: "Payments",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Lessons_LessonId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_LessonId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "Payments");
        }
    }
}
