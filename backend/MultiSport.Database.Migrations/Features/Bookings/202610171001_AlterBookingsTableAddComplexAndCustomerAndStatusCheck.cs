using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Bookings;

[Migration(202610171001)]
public class AlterBookingsTableAddComplexAndCustomerAndStatusCheck : Migration
{
    public override void Up()
    {
        // 1. Agregar columna complex_id como nullable temporalmente para poblar datos existentes
        Alter.Table("bookings")
            .AddColumn("complex_id").AsCustom("UUID").Nullable();

        // 2. Poblar complex_id desde courts.complex_id si existen reservas previas
        Execute.Sql(@"
            UPDATE bookings b
            SET complex_id = c.complex_id
            FROM courts c
            WHERE b.court_id = c.id AND b.complex_id IS NULL;
        ");

        // 3. Establecer complex_id como NOT NULL con clave foránea
        Alter.Table("bookings")
            .AlterColumn("complex_id").AsCustom("UUID").NotNullable()
            .ForeignKey("fk_bookings_complexes", "complexes", "id").OnDelete(System.Data.Rule.Cascade);

        // 4. Agregar customer_id opcional referenciando a la tabla customers
        Alter.Table("bookings")
            .AddColumn("customer_id").AsCustom("UUID").Nullable()
            .ForeignKey("fk_bookings_customers", "customers", "id").OnDelete(System.Data.Rule.SetNull);

        // 5. Restricción CHECK de estados formales
        Execute.Sql("ALTER TABLE bookings ADD CONSTRAINT ck_bookings_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'expired', 'blocked'));");

        // 6. Índice de alta velocidad para la grilla operativa del complejo
        Execute.Sql("CREATE INDEX idx_bookings_complex_timerange ON bookings (complex_id, start_time_utc) WHERE (deleted_at IS NULL);");
    }

    public override void Down()
    {
        Execute.Sql("DROP INDEX IF EXISTS idx_bookings_complex_timerange;");
        Execute.Sql("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS ck_bookings_status;");

        Delete.ForeignKey("fk_bookings_customers").OnTable("bookings");
        Delete.Column("customer_id").FromTable("bookings");

        Delete.ForeignKey("fk_bookings_complexes").OnTable("bookings");
        Delete.Column("complex_id").FromTable("bookings");
    }
}
