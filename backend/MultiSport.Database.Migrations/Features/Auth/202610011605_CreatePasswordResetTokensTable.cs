using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610011605)]
public class CreatePasswordResetTokensTable : Migration
{
    public override void Up()
    {
        Create.Table("password_reset_tokens")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_password_reset_tokens").WithDefault(SystemMethods.NewGuid)
            .WithColumn("user_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_password_reset_tokens_users", "users", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("token_hash").AsString(255).NotNullable()
            .WithColumn("expires_at_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("created_at_utc").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("used_at_utc").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("created_by_ip").AsString(45).Nullable();

        Create.Index("idx_password_reset_tokens_user_id").OnTable("password_reset_tokens").OnColumn("user_id");
        Create.Index("idx_password_reset_tokens_token_hash").OnTable("password_reset_tokens").OnColumn("token_hash");
    }

    public override void Down()
    {
        Delete.Table("password_reset_tokens");
    }
}
