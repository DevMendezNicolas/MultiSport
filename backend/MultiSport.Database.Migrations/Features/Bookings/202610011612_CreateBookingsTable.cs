using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Bookings;

[Migration(202610011612)]
public class CreateBookingsTable : Migration
{
    public override void Up()
    {
        Create.Table("bookings")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_bookings").WithDefault(SystemMethods.NewGuid)
            .WithColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_bookings_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("sport_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_bookings_sports", "sports", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("customer_name").AsString(150).NotNullable()
            .WithColumn("customer_phone").AsString(50).NotNullable()
            .WithColumn("customer_email").AsString(255).Nullable()
            .WithColumn("start_time_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("end_time_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("total_price").AsDecimal(10, 2).NotNullable()
            .WithColumn("deposit_amount").AsDecimal(10, 2).NotNullable().WithDefaultValue(0.00)
            .WithColumn("status").AsString(30).NotNullable().WithDefaultValue("pending")
            .WithColumn("expires_at_utc").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("is_recurring").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("recurring_group_id").AsCustom("UUID").Nullable()
            .WithColumn("notes").AsCustom("TEXT").Nullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();

        Execute.Sql("ALTER TABLE bookings ADD CONSTRAINT ck_bookings_total_price_positive CHECK (total_price >= 0);");
        Execute.Sql("ALTER TABLE bookings ADD CONSTRAINT ck_bookings_deposit_positive CHECK (deposit_amount >= 0);");
        Execute.Sql("ALTER TABLE bookings ADD CONSTRAINT ck_bookings_valid_timerange CHECK (end_time_utc > start_time_utc);");

        Create.Index("idx_bookings_court_id").OnTable("bookings").OnColumn("court_id");
        Create.Index("idx_bookings_start_time_utc").OnTable("bookings").OnColumn("start_time_utc");
        Execute.Sql("CREATE INDEX idx_bookings_active ON bookings (court_id, start_time_utc) WHERE (deleted_at IS NULL);");

        // Restricción GiST Anti-Solapamiento (PostgreSQL Exclusion Constraint)
        Execute.Sql(@"
            ALTER TABLE bookings ADD CONSTRAINT exc_bookings_no_overlap EXCLUDE USING gist (
                court_id WITH =,
                tstzrange(start_time_utc, end_time_utc) WITH &&
            ) WHERE (deleted_at IS NULL AND status NOT IN ('cancelled', 'expired'));
        ");
    }

    public override void Down()
    {
        Delete.Table("bookings");
    }
}
