using FluentMigrator;

namespace MultiSport.Database.Migrations.Features.Courts;

[Migration(202610082050)]
public class SeedSportsTable : Migration
{
    public override void Up()
    {
        // 1. Eliminar cualquier deporte no canónico previo
        Execute.Sql(@"
            DELETE FROM sports 
            WHERE id NOT IN (
                'ce136a41-1dae-4f72-a632-57aea86154ca',
                '8f4fe1ab-41ae-4d3e-bd75-34bc4d459a8f',
                '608029c8-745f-4841-8bbc-5cb413c92917',
                '236a1f5a-dca3-4478-8600-89afda79371f',
                '00ec7aeb-6a38-4730-8f74-3295df095626',
                '706dba9f-ac6c-45ee-a0c5-0f7f6d37da3a',
                '4616667c-8b7f-4c00-bbe6-48d928bce959',
                '0cecf018-8ad6-4ea5-bd6b-cc7db0dcfce9',
                'e1e8e1ec-4ea1-4779-80dd-27fec121a9a9',
                '65f3e1da-88d3-4ff8-8dd9-4926e2456354'
            );
        ");

        // 2. Insertar o actualizar de forma idempotente los 10 deportes canónicos
        Execute.Sql(@"
            INSERT INTO sports (id, name, icon_url, max_players, is_active, created_at, updated_at, deleted_at)
            VALUES 
                ('ce136a41-1dae-4f72-a632-57aea86154ca', 'Basket', 'pelota-basket', 10, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('8f4fe1ab-41ae-4d3e-bd75-34bc4d459a8f', 'Futbol 11', 'pelota-futbol', 22, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('608029c8-745f-4841-8bbc-5cb413c92917', 'Futbol 5', 'pelota-futbol', 10, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('236a1f5a-dca3-4478-8600-89afda79371f', 'Futbol 6', 'pelota-futbol', 12, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('00ec7aeb-6a38-4730-8f74-3295df095626', 'Futbol 7', 'pelota-futbol', 14, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('706dba9f-ac6c-45ee-a0c5-0f7f6d37da3a', 'Futbol 9', 'pelota-futbol', 18, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('4616667c-8b7f-4c00-bbe6-48d928bce959', 'Handball', 'pelota-handball', 14, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('0cecf018-8ad6-4ea5-bd6b-cc7db0dcfce9', 'Padel', 'pelota-padel', 4, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('e1e8e1ec-4ea1-4779-80dd-27fec121a9a9', 'Tenis', 'pelota-tenis', 4, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL),
                ('65f3e1da-88d3-4ff8-8dd9-4926e2456354', 'Voley', 'pelota-voley', 12, true, '2026-10-05 22:28:28.500016+00', '2026-10-05 22:28:28.500016+00', NULL)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                icon_url = EXCLUDED.icon_url,
                max_players = EXCLUDED.max_players,
                is_active = EXCLUDED.is_active,
                updated_at = EXCLUDED.updated_at,
                deleted_at = EXCLUDED.deleted_at;
        ");
    }

    public override void Down()
    {
        Execute.Sql(@"
            DELETE FROM sports 
            WHERE id IN (
                'ce136a41-1dae-4f72-a632-57aea86154ca',
                '8f4fe1ab-41ae-4d3e-bd75-34bc4d459a8f',
                '608029c8-745f-4841-8bbc-5cb413c92917',
                '236a1f5a-dca3-4478-8600-89afda79371f',
                '00ec7aeb-6a38-4730-8f74-3295df095626',
                '706dba9f-ac6c-45ee-a0c5-0f7f6d37da3a',
                '4616667c-8b7f-4c00-bbe6-48d928bce959',
                '0cecf018-8ad6-4ea5-bd6b-cc7db0dcfce9',
                'e1e8e1ec-4ea1-4779-80dd-27fec121a9a9',
                '65f3e1da-88d3-4ff8-8dd9-4926e2456354'
            );
        ");
    }
}
