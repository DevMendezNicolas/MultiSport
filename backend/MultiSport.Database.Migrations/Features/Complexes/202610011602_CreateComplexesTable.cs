using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Complexes;

[Migration(202610011602)]
public class CreateComplexesTable : Migration
{
    public override void Up()
    {
        Create.Table("complexes")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_complexes").WithDefault(SystemMethods.NewGuid)
            .WithColumn("name").AsString(150).NotNullable()
            .WithColumn("tax_id").AsString(20).NotNullable()
            .WithColumn("cbu_alias").AsString(50).NotNullable()
            .WithColumn("address").AsString(255).NotNullable()
            .WithColumn("phone").AsString(50).NotNullable()
            .WithColumn("city").AsString(100).NotNullable()
            .WithColumn("logo_url").AsCustom("TEXT").Nullable()
            .WithColumn("is_active").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();
    }

    public override void Down()
    {
        Delete.Table("complexes");
    }
}
