using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610011604)]
public class CreateRefreshTokensTable : Migration
{
    public override void Up()
    {
        Create.Table("refresh_tokens")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_refresh_tokens").WithDefault(SystemMethods.NewGuid)
            .WithColumn("user_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_refresh_tokens_users", "users", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("token_hash").AsString(255).NotNullable()
            .WithColumn("expires_at_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("created_at_utc").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("revoked_at_utc").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("replaced_by_token").AsString(255).Nullable();

        Create.Index("idx_refresh_tokens_user_id").OnTable("refresh_tokens").OnColumn("user_id");
        Create.Index("idx_refresh_tokens_token_hash").OnTable("refresh_tokens").OnColumn("token_hash");
    }

    public override void Down()
    {
        Delete.Table("refresh_tokens");
    }
}
