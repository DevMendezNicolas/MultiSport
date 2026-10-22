using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610220940)]
public class AlterRefreshTokensTableAddAbsoluteExpiresAtColumn : Migration
{
    public override void Up()
    {
        Alter.Table("refresh_tokens")
            .AddColumn("absolute_expires_at_utc").AsCustom("TIMESTAMPTZ").Nullable();

        Execute.Sql("UPDATE refresh_tokens SET absolute_expires_at_utc = expires_at_utc WHERE absolute_expires_at_utc IS NULL;");

        Alter.Table("refresh_tokens")
            .AlterColumn("absolute_expires_at_utc").AsCustom("TIMESTAMPTZ").NotNullable();
    }

    public override void Down()
    {
        Delete.Column("absolute_expires_at_utc").FromTable("refresh_tokens");
    }
}
