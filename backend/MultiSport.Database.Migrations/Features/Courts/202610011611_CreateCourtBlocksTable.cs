using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610011611)]
public class CreateCourtBlocksTable : Migration
{
    public override void Up()
    {
        Create.Table("court_blocks")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_court_blocks").WithDefault(SystemMethods.NewGuid)
            .WithColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_court_blocks_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("start_time_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("end_time_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("reason").AsString(255).NotNullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable();

        Execute.Sql("ALTER TABLE court_blocks ADD CONSTRAINT ck_court_blocks_valid_timerange CHECK (end_time_utc > start_time_utc);");
        Create.Index("idx_court_blocks_court_timerange").OnTable("court_blocks").OnColumn("court_id").Ascending().OnColumn("start_time_utc").Ascending();
    }

    public override void Down()
    {
        Delete.Table("court_blocks");
    }
}
