using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Customers;

[Migration(202610171000)]
public class CreateCustomersTable : Migration
{
    public override void Up()
    {
        Create.Table("customers")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_customers").WithDefault(SystemMethods.NewGuid)
            .WithColumn("complex_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_customers_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("name").AsString(150).NotNullable()
            .WithColumn("phone").AsString(50).NotNullable()
            .WithColumn("email").AsString(255).Nullable()
            .WithColumn("notes").AsCustom("TEXT").Nullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();

        Create.Index("idx_customers_complex_phone")
            .OnTable("customers")
            .OnColumn("complex_id").Ascending()
            .OnColumn("phone").Ascending();

        Create.Index("idx_customers_complex_name")
            .OnTable("customers")
            .OnColumn("complex_id").Ascending()
            .OnColumn("name").Ascending();
    }

    public override void Down()
    {
        Delete.Table("customers");
    }
}
