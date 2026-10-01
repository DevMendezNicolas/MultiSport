using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011609)]
public class CreateCourtsSportsTable : Migration
{
    public override void Up()
    {
        Create.Table("courts_sports")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_courts_sports").WithDefault(SystemMethods.NewGuid)
            .WithColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_courts_sports_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("sport_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_courts_sports_sports", "sports", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("duration_minutes").AsInt32().NotNullable().WithDefaultValue(60)
            .WithColumn("base_price").AsDecimal(10, 2).NotNullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        Create.UniqueConstraint("uq_courts_sports_court_sport")
            .OnTable("courts_sports")
            .Columns("court_id", "sport_id");

        Execute.Sql("ALTER TABLE courts_sports ADD CONSTRAINT ck_courts_sports_base_price_positive CHECK (base_price >= 0);");
        Execute.Sql("ALTER TABLE courts_sports ADD CONSTRAINT ck_courts_sports_duration_positive CHECK (duration_minutes > 0);");
    }

    public override void Down()
    {
        Delete.Table("courts_sports");
    }
}
