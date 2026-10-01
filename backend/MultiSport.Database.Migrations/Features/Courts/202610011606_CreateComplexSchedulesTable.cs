using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011606)]
public class CreateComplexSchedulesTable : Migration
{
    public override void Up()
    {
        Create.Table("complex_schedules")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_complex_schedules").WithDefault(SystemMethods.NewGuid)
            .WithColumn("complex_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_complex_schedules_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("day_of_week").AsInt32().NotNullable()
            .WithColumn("opening_time").AsCustom("TIME").NotNullable()
            .WithColumn("closing_time").AsCustom("TIME").NotNullable()
            .WithColumn("is_closed").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        Create.UniqueConstraint("uq_complex_schedules_complex_day")
            .OnTable("complex_schedules")
            .Columns("complex_id", "day_of_week");

        Execute.Sql("ALTER TABLE complex_schedules ADD CONSTRAINT ck_complex_schedules_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);");
    }

    public override void Down()
    {
        Delete.Table("complex_schedules");
    }
}
