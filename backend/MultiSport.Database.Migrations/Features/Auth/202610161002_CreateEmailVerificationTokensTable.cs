using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610161002)]
public class CreateEmailVerificationTokensTable : Migration
{
    public override void Up()
    {
        Create.Table("email_verification_tokens")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_email_verification_tokens").WithDefault(SystemMethods.NewGuid)
            .WithColumn("user_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_email_verification_tokens_users", "users", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("token_hash").AsString(64).NotNullable()
            .WithColumn("expires_at_utc").AsCustom("TIMESTAMPTZ").NotNullable()
            .WithColumn("created_at_utc").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("used_at_utc").AsCustom("TIMESTAMPTZ").Nullable();

        Create.Index("idx_email_verification_tokens_user_id")
            .OnTable("email_verification_tokens")
            .OnColumn("user_id");

        Create.Index("idx_email_verification_tokens_hash")
            .OnTable("email_verification_tokens")
            .OnColumn("token_hash");
    }

    public override void Down()
    {
        Delete.Table("email_verification_tokens");
    }
}
