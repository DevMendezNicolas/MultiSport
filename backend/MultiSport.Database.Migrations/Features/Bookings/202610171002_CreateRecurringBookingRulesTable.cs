using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Bookings;

[Migration(202610171002)]
public class CreateRecurringBookingRulesTable : Migration
{
    public override void Up()
    {
        Create.Table("recurring_booking_rules")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_recurring_booking_rules").WithDefault(SystemMethods.NewGuid)
            .WithColumn("complex_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_recurring_rules_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_recurring_rules_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("sport_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_recurring_rules_sports", "sports", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("customer_id").AsCustom("UUID").Nullable()
                .ForeignKey("fk_recurring_rules_customers", "customers", "id").OnDelete(System.Data.Rule.SetNull)
            .WithColumn("customer_name").AsString(150).NotNullable()
            .WithColumn("customer_phone").AsString(50).NotNullable()
            .WithColumn("day_of_week").AsInt32().NotNullable()
            .WithColumn("start_time").AsCustom("TIME").NotNullable()
            .WithColumn("end_time").AsCustom("TIME").NotNullable()
            .WithColumn("price").AsDecimal(10, 2).NotNullable()
            .WithColumn("is_active").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("notes").AsCustom("TEXT").Nullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();

        Execute.Sql("ALTER TABLE recurring_booking_rules ADD CONSTRAINT ck_recurring_rules_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);");
        Execute.Sql("ALTER TABLE recurring_booking_rules ADD CONSTRAINT ck_recurring_rules_price_positive CHECK (price >= 0);");
        Execute.Sql("ALTER TABLE recurring_booking_rules ADD CONSTRAINT ck_recurring_rules_timerange CHECK (end_time > start_time);");

        Create.Index("idx_recurring_rules_lookup")
            .OnTable("recurring_booking_rules")
            .OnColumn("complex_id").Ascending()
            .OnColumn("court_id").Ascending()
            .OnColumn("day_of_week").Ascending();
    }

    public override void Down()
    {
        Delete.Table("recurring_booking_rules");
    }
}
