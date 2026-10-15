using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610161001)]
public class AlterUsersTableAddEmailVerificationColumns : Migration
{
    public override void Up()
    {
        Alter.Table("users")
            .AddColumn("is_email_verified").AsBoolean().NotNullable().WithDefaultValue(false)
            .AddColumn("email_verified_at_utc").AsCustom("TIMESTAMPTZ").Nullable();

        // Marcar usuarios existentes como verificados para no bloquear desarrollo previo
        Execute.Sql("UPDATE users SET is_email_verified = true, email_verified_at_utc = CURRENT_TIMESTAMP WHERE is_email_verified = false;");
    }

    public override void Down()
    {
        Delete.Column("email_verified_at_utc").FromTable("users");
        Delete.Column("is_email_verified").FromTable("users");
    }
}
