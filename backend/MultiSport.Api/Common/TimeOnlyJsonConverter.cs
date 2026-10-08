using System.Text.Json;
using System.Text.Json.Serialization;

namespace MultiSport.Api.Common;

/// <summary>
/// Convertidor JSON resiliente para TimeOnly que soporta formatos 'HH:mm', 'HH:mm:ss' y variantes ISO.
/// </summary>
public sealed class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
{
    private const string DefaultFormat = "HH:mm:ss";

    public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var str = reader.GetString();
        if (string.IsNullOrWhiteSpace(str))
        {
            return default;
        }

        if (TimeOnly.TryParse(str, out var time))
        {
            return time;
        }

        throw new JsonException($"El valor '{str}' no es un formato de hora válido. Utilice 'HH:mm' o 'HH:mm:ss'.");
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(DefaultFormat));
    }
}
