namespace MultiSport.Api.Common;

public readonly record struct ComplexDaySlice(
    DateOnly LocalDate,
    int DayOfWeek,
    TimeSpan SliceStart,
    TimeSpan SliceEnd);

public static class ComplexTimeHelper
{
    public static readonly TimeSpan ComplexOffset = TimeSpan.FromHours(-3);
    public static readonly TimeSpan EndOfDayTimeSpan = TimeSpan.FromHours(24);

    public static DateTimeOffset ToComplexLocal(DateTimeOffset timestamp) =>
        timestamp.ToOffset(ComplexOffset);

    public static DateOnly GetCurrentComplexLocalDate() =>
        DateOnly.FromDateTime(ToComplexLocal(DateTimeOffset.UtcNow).DateTime);

    public static (DateTimeOffset StartUtc, DateTimeOffset EndUtc) GetComplexDayBoundsUtc(DateOnly localDate)
    {
        var startLocal = new DateTimeOffset(localDate.ToDateTime(TimeOnly.MinValue), ComplexOffset);
        var endLocal = startLocal.AddDays(1);
        return (startLocal.ToUniversalTime(), endLocal.ToUniversalTime());
    }

    public static DateTimeOffset CombineComplexLocalToUtc(DateOnly localDate, TimeSpan timeOfDay)
    {
        var baseLocal = new DateTimeOffset(localDate.ToDateTime(TimeOnly.MinValue), ComplexOffset);
        return baseLocal.Add(timeOfDay).ToUniversalTime();
    }

    public static bool IsQuarterHourAligned(DateTimeOffset timestamp)
    {
        var local = ToComplexLocal(timestamp);
        return local.Second == 0
            && local.Millisecond == 0
            && local.Microsecond == 0
            && local.Minute % 15 == 0;
    }

    public static bool IsQuarterHourAligned(TimeOnly time)
    {
        return time.Second == 0
            && time.Millisecond == 0
            && time.Microsecond == 0
            && time.Minute % 15 == 0;
    }

    public static IReadOnlyList<ComplexDaySlice> SplitIntoComplexLocalDaySlices(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc)
    {
        if (endUtc <= startUtc)
        {
            return Array.Empty<ComplexDaySlice>();
        }

        var localStart = ToComplexLocal(startUtc);
        var localEnd = ToComplexLocal(endUtc);

        var slices = new List<ComplexDaySlice>();
        var currentDate = DateOnly.FromDateTime(localStart.DateTime);

        while (true)
        {
            var dayStart = new DateTimeOffset(currentDate.ToDateTime(TimeOnly.MinValue), ComplexOffset);
            if (dayStart >= localEnd)
            {
                break;
            }

            var dayEnd = dayStart.AddDays(1);
            var effectiveStart = localStart > dayStart ? localStart : dayStart;
            var effectiveEnd = localEnd < dayEnd ? localEnd : dayEnd;

            if (effectiveEnd > effectiveStart)
            {
                var sliceStart = effectiveStart - dayStart;
                var sliceEnd = effectiveEnd - dayStart;
                slices.Add(new ComplexDaySlice(
                    LocalDate: currentDate,
                    DayOfWeek: (int)currentDate.DayOfWeek,
                    SliceStart: sliceStart,
                    SliceEnd: sliceEnd));
            }

            currentDate = currentDate.AddDays(1);
        }

        return slices;
    }

    public static TimeSpan NormalizeEndTimeSpan(TimeOnly endTime) =>
        endTime == TimeOnly.MinValue ? EndOfDayTimeSpan : endTime.ToTimeSpan();

    public static TimeSpan NormalizeEndTimeSpan(TimeSpan endTime) =>
        endTime == TimeSpan.Zero ? EndOfDayTimeSpan : endTime;

    public static bool IsSliceCoveredByContinuousIntervals(
        TimeSpan sliceStart,
        TimeSpan sliceEnd,
        IEnumerable<(TimeSpan Start, TimeSpan End)> availableIntervals)
    {
        var sorted = availableIntervals
            .Select(i => (Start: i.Start, End: i.End == TimeSpan.Zero ? EndOfDayTimeSpan : i.End))
            .Where(i => i.End > i.Start)
            .OrderBy(i => i.Start)
            .ThenBy(i => i.End)
            .ToList();

        if (sorted.Count == 0)
        {
            return false;
        }

        var merged = new List<(TimeSpan Start, TimeSpan End)>();
        var current = sorted[0];

        for (var i = 1; i < sorted.Count; i++)
        {
            var next = sorted[i];
            if (next.Start <= current.End)
            {
                current = (current.Start, next.End > current.End ? next.End : current.End);
            }
            else
            {
                merged.Add(current);
                current = next;
            }
        }
        merged.Add(current);

        return merged.Any(m => m.Start <= sliceStart && m.End >= sliceEnd);
    }

    public static IEnumerable<(TimeSpan Start, TimeSpan End)> ProjectRecurringRuleOntoLocalDay(
        int ruleDayOfWeek,
        TimeSpan ruleStart,
        TimeSpan ruleEnd,
        int targetDayOfWeek)
    {
        if (ruleDayOfWeek == targetDayOfWeek)
        {
            if (ruleEnd > ruleStart)
            {
                yield return (ruleStart, ruleEnd);
            }
            else if (ruleEnd <= ruleStart)
            {
                yield return (ruleStart, EndOfDayTimeSpan);
            }
        }

        var previousDayOfWeek = (targetDayOfWeek + 6) % 7;
        if (ruleDayOfWeek == previousDayOfWeek && ruleEnd < ruleStart && ruleEnd > TimeSpan.Zero)
        {
            yield return (TimeSpan.Zero, ruleEnd);
        }
    }

    public static string GetDayOfWeekName(int dayOfWeek) => dayOfWeek switch
    {
        0 => "Domingo",
        1 => "Lunes",
        2 => "Martes",
        3 => "Miércoles",
        4 => "Jueves",
        5 => "Viernes",
        6 => "Sábado",
        _ => "Día desconocido"
    };
}
