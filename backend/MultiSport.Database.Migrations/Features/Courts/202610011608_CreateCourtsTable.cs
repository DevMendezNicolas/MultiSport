using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011608)]
public class CreateCourtsTable : Migration
{
    public override void Up()
    {
        Create.Table("courts")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_courts").WithDefault(SystemMethods.NewGuid)
            .WithColumn("complex_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_courts_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("surface_type").AsString(50).NotNullable()
            .WithColumn("is_covered").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("has_lighting").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("buffer_minutes").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("is_active").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();

        Create.Index("idx_courts_complex_id").OnTable("courts").OnColumn("complex_id");
    }

    public override void Down()
    {
        Delete.Table("courts");
    }
}
