using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace BlazorVideoChat.Server.Data.Migrations
{
    public partial class AddCallData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CallData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HostId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttendeeToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsInProgress = table.Column<bool>(type: "bit", nullable: false),
                    StartDateTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CallData", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CallData");
        }
    }
}
