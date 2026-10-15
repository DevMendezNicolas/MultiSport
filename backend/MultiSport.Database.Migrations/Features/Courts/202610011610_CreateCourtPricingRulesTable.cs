using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011610)]
public class CreateCourtPricingRulesTable : Migration
{
    public override void Up()
    {
        Create.Table("court_pricing_rules")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_court_pricing_rules").WithDefault(SystemMethods.NewGuid)
            .WithColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_court_pricing_rules_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("sport_id").AsCustom("UUID").Nullable()
                .ForeignKey("fk_court_pricing_rules_sports", "sports", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("day_of_week").AsInt32().Nullable()
            .WithColumn("start_time").AsCustom("TIME").NotNullable()
            .WithColumn("end_time").AsCustom("TIME").NotNullable()
            .WithColumn("price").AsDecimal(10, 2).NotNullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_price_positive CHECK (price >= 0);");
        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));");
    }

    public override void Down()
    {
        Delete.Table("court_pricing_rules");
    }
}
