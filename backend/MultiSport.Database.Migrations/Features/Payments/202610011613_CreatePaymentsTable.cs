using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Payments;

[Migration(202610011613)]
public class CreatePaymentsTable : Migration
{
    public override void Up()
    {
        Create.Table("payments")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_payments").WithDefault(SystemMethods.NewGuid)
            .WithColumn("booking_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_payments_bookings", "bookings", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("amount").AsDecimal(10, 2).NotNullable()
            .WithColumn("payment_method").AsString(30).NotNullable()
            .WithColumn("payment_type").AsString(30).NotNullable()
            .WithColumn("status").AsString(30).NotNullable().WithDefaultValue("approved")
            .WithColumn("receipt_url").AsCustom("TEXT").Nullable()
            .WithColumn("notes").AsString(255).Nullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable();

        Execute.Sql("ALTER TABLE payments ADD CONSTRAINT ck_payments_amount_positive CHECK (amount > 0);");
        Create.Index("idx_payments_booking_id").OnTable("payments").OnColumn("booking_id");
    }

    public override void Down()
    {
        Delete.Table("payments");
    }
}
