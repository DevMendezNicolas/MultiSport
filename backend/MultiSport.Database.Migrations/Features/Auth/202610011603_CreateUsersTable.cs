using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Auth;

[Migration(202610011603)]
public class CreateUsersTable : Migration
{
    public override void Up()
    {
        Create.Table("users")
            .WithColumn("id").AsCustom("UUID").PrimaryKey("pk_users").WithDefault(SystemMethods.NewGuid)
            .WithColumn("complex_id").AsCustom("UUID").NotNullable().Unique("uq_users_complex_id")
                .ForeignKey("fk_users_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade)
            .WithColumn("email").AsString(255).NotNullable().Unique("uq_users_email")
            .WithColumn("password_hash").AsString(255).NotNullable()
            .WithColumn("role").AsString(50).NotNullable().WithDefaultValue("complex_admin")
            .WithColumn("is_active").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("failed_login_attempts").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("lockout_end_utc").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("last_login_at_utc").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("created_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("created_by").AsCustom("UUID").Nullable()
            .WithColumn("updated_at").AsCustom("TIMESTAMPTZ").NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("updated_by").AsCustom("UUID").Nullable()
            .WithColumn("deleted_at").AsCustom("TIMESTAMPTZ").Nullable()
            .WithColumn("deleted_by").AsCustom("UUID").Nullable();
    }

    public override void Down()
    {
        Delete.Table("users");
    }
}
