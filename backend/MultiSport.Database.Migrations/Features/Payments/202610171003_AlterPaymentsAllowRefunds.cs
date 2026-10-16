using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Payments;

[Migration(202610171003)]
public class AlterPaymentsAllowRefunds : Migration
{
    public override void Up()
    {
        // Modificar restricción para permitir montos negativos exclusivamente en pagos de tipo 'refund'
        Execute.Sql("ALTER TABLE payments DROP CONSTRAINT IF EXISTS ck_payments_amount_positive;");
        Execute.Sql("ALTER TABLE payments ADD CONSTRAINT ck_payments_valid_amount CHECK ((payment_type = 'refund' AND amount < 0) OR (payment_type <> 'refund' AND amount > 0));");
    }

    public override void Down()
    {
        Execute.Sql("ALTER TABLE payments DROP CONSTRAINT IF EXISTS ck_payments_valid_amount;");
        Execute.Sql("ALTER TABLE payments ADD CONSTRAINT ck_payments_amount_positive CHECK (amount > 0);");
    }
}
