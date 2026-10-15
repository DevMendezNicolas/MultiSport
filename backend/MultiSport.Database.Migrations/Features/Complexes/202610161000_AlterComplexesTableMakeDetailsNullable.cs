using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Complexes;

[Migration(202610161000)]
public class AlterComplexesTableMakeDetailsNullable : Migration
{
    public override void Up()
    {
        Alter.Table("complexes")
            .AlterColumn("tax_id").AsString(20).Nullable()
            .AlterColumn("cbu_alias").AsString(50).Nullable()
            .AlterColumn("address").AsString(255).Nullable()
            .AlterColumn("phone").AsString(50).Nullable()
            .AlterColumn("city").AsString(100).Nullable();
    }

    public override void Down()
    {
        Alter.Table("complexes")
            .AlterColumn("tax_id").AsString(20).NotNullable()
            .AlterColumn("cbu_alias").AsString(50).NotNullable()
            .AlterColumn("address").AsString(255).NotNullable()
            .AlterColumn("phone").AsString(50).NotNullable()
            .AlterColumn("city").AsString(100).NotNullable();
    }
}
