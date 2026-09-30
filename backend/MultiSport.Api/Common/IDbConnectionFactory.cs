using System.Data.Common;

namespace MultiSport.Api.Common;

/// <summary>
/// Contrato para la creación de conexiones a base de datos efímeras y scoped.
/// </summary>
public interface IDbConnectionFactory
{
    Task<DbConnection> CreateConnectionAsync(CancellationToken ct = default);
}
