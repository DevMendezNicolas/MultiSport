using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610091000)]
public class RemoveBufferMinutesFromCourtsTable : Migration
{
    public override void Up()
    {
        Delete.Column("buffer_minutes").FromTable("courts");
    }

    public override void Down()
    {
        Alter.Table("courts")
            .AddColumn("buffer_minutes").AsInt32().NotNullable().WithDefaultValue(0);
    }
}
