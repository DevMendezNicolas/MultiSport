using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610081000)]
public class AlterCourtPricingRulesAddCourtSportAndDuration : Migration
{
    public override void Up()
    {
        // 1. Eliminar foreign keys antiguas
        Delete.ForeignKey("fk_court_pricing_rules_courts").OnTable("court_pricing_rules");
        Delete.ForeignKey("fk_court_pricing_rules_sports").OnTable("court_pricing_rules");

        // 2. Eliminar constraint antigua de day_of_week (para actualizarla a NOT NULL y 0..6)
        Execute.Sql("ALTER TABLE court_pricing_rules DROP CONSTRAINT IF EXISTS ck_court_pricing_rules_day_of_week;");

        // 3. Eliminar columnas que duplicaban la relación court_sports
        Delete.Column("court_id").FromTable("court_pricing_rules");
        Delete.Column("sport_id").FromTable("court_pricing_rules");

        // 4. Agregar court_sport_id vinculando directamente a courts_sports(id)
        Alter.Table("court_pricing_rules")
            .AddColumn("court_sport_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_court_pricing_rules_courts_sports", "courts_sports", "id").OnDelete(System.Data.Rule.Cascade);

        // 5. Ajustar day_of_week a NOT NULL
        Alter.Table("court_pricing_rules")
            .AlterColumn("day_of_week").AsInt32().NotNullable();

        // 6. Agregar duration_minutes configurable libremente
        Alter.Table("court_pricing_rules")
            .AddColumn("duration_minutes").AsInt32().NotNullable().WithDefaultValue(60);

        // 7. Check constraints
        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);");
        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_duration_positive CHECK (duration_minutes > 0);");
        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_time_range CHECK (end_time > start_time OR (end_time = '00:00:00'::time AND start_time > '00:00:00'::time));");

        // 8. Índice B-Tree para optimizar consultas de agenda semanal por deporte
        Create.Index("idx_court_pricing_rules_court_sport_day")
            .OnTable("court_pricing_rules")
            .OnColumn("court_sport_id").Ascending()
            .OnColumn("day_of_week").Ascending();

        // 9. Función inmutable para mapear horario diario a rango continuo (soportando cierre 00:00 como 86400s)
        Execute.Sql(@"
            CREATE OR REPLACE FUNCTION court_pricing_time_to_day_range(s time, e time) 
            RETURNS int4range LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
                SELECT int4range(
                    EXTRACT(EPOCH FROM s)::integer, 
                    CASE WHEN e = '00:00:00'::time THEN 86400 ELSE EXTRACT(EPOCH FROM e)::integer END
                );
            $$;
        ");

        // 10. Restricción GiST Anti-Solapamiento (PostgreSQL Exclusion Constraint)
        Execute.Sql(@"
            ALTER TABLE court_pricing_rules ADD CONSTRAINT exc_court_pricing_rules_no_overlap EXCLUDE USING gist (
                court_sport_id WITH =,
                day_of_week WITH =,
                court_pricing_time_to_day_range(start_time, end_time) WITH &&
            );
        ");
    }

    public override void Down()
    {
        Execute.Sql("ALTER TABLE court_pricing_rules DROP CONSTRAINT IF EXISTS exc_court_pricing_rules_no_overlap;");
        Execute.Sql("DROP FUNCTION IF EXISTS court_pricing_time_to_day_range(time, time);");

        Delete.Index("idx_court_pricing_rules_court_sport_day").OnTable("court_pricing_rules");

        Execute.Sql("ALTER TABLE court_pricing_rules DROP CONSTRAINT IF EXISTS ck_court_pricing_rules_time_range;");
        Execute.Sql("ALTER TABLE court_pricing_rules DROP CONSTRAINT IF EXISTS ck_court_pricing_rules_duration_positive;");
        Execute.Sql("ALTER TABLE court_pricing_rules DROP CONSTRAINT IF EXISTS ck_court_pricing_rules_day_of_week;");

        Delete.Column("duration_minutes").FromTable("court_pricing_rules");

        Delete.ForeignKey("fk_court_pricing_rules_courts_sports").OnTable("court_pricing_rules");
        Delete.Column("court_sport_id").FromTable("court_pricing_rules");

        Alter.Table("court_pricing_rules")
            .AlterColumn("day_of_week").AsInt32().Nullable();

        Alter.Table("court_pricing_rules")
            .AddColumn("court_id").AsCustom("UUID").NotNullable()
                .ForeignKey("fk_court_pricing_rules_courts", "courts", "id").OnDelete(System.Data.Rule.Cascade)
            .AddColumn("sport_id").AsCustom("UUID").Nullable()
                .ForeignKey("fk_court_pricing_rules_sports", "sports", "id").OnDelete(System.Data.Rule.Cascade);

        Execute.Sql("ALTER TABLE court_pricing_rules ADD CONSTRAINT ck_court_pricing_rules_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));");
    }
}
