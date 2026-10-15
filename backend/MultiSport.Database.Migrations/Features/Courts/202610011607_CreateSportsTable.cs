using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011607)]
public class CreateSportsTable : Migration
{
    public override void Up()
    {
        Create.Table("sports")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_sports").WithDefault(SystemMethods.NewGuid)
            .WithColumn("name").AsString(100).NotNullable().Unique("uq_sports_name")
            .WithColumn("icon_url").AsCustom("TEXT").Nullable()
            .WithColumn("max_players").AsInt32().NotNullable().WithDefaultValue(10)
            .WithColumn("is_active").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable();
    }

    public override void Down()
    {
        Delete.Table("sports");
    }
}
