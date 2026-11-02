using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Bookings;

[Migration(202610311800)]
public class AlterRecurringBookingRulesAllowOvernightTimerange : Migration
{
    public override void Up()
    {
        Execute.Sql(@"
            ALTER TABLE recurring_booking_rules
            DROP CONSTRAINT IF EXISTS ck_recurring_rules_timerange;

            ALTER TABLE recurring_booking_rules
            ADD CONSTRAINT ck_recurring_rules_timerange CHECK (end_time <> start_time);
        ");
    }

    public override void Down()
    {
        Execute.Sql(@"
            ALTER TABLE recurring_booking_rules
            DROP CONSTRAINT IF EXISTS ck_recurring_rules_timerange;

            UPDATE recurring_booking_rules
               SET is_active = false,
                   deleted_at = COALESCE(deleted_at, NOW()),
                   end_time = '23:59:59'
             WHERE end_time <= start_time AND start_time >= '23:59:00';

            UPDATE recurring_booking_rules
               SET end_time = '23:59:59',
                   updated_at = NOW()
             WHERE end_time <= start_time;

            ALTER TABLE recurring_booking_rules
            ADD CONSTRAINT ck_recurring_rules_timerange CHECK (end_time > start_time);
        ");
    }
}

