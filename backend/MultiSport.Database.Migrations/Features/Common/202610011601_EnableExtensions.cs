using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Common;

[Migration(202610011601)]
public class EnableExtensions : Migration
{
    public override void Up()
    {
        Execute.Sql("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
        Execute.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");
    }

    public override void Down()
    {
        // No se remueven extensiones a nivel de cluster/db para no afectar otras dependencias
    }
}
