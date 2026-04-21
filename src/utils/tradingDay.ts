import { addDays } from 'date-fns';

/**
 * Calculates the Futures Trading Day based on a 5:00 PM EST rollover.
 * Rules:
 * - Trade Session starts at Sunday 6:00 PM EST (Audit Day: Monday).
 * - Trade Session ends at Friday 5:00 PM EST (Audit Day: Friday).
 * - Boundary is 5:00 PM EST (17:00). Anything after 17:00 belongs to the NEXT trading day.
 * - Friday 17:00+ through Sunday 16:59:59 belongs to Monday's trading day.
 */
export function getTradingDay(date: Date | string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    // Extract New York time parts accurately
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });

    const partsArr = nyFormatter.formatToParts(d);
    const parts: Record<string, string> = {};
    partsArr.forEach(p => parts[p.type] = p.value);

    const hour = parseInt(parts.hour);
    const weekday = parts.weekday; // "Monday", "Tuesday", etc.

    let tradingDate = new Date(d);

    // End of session is 5 PM EST. Anything after is "Next Day".
    if (hour >= 17) {
        if (weekday === 'Friday') {
            tradingDate = addDays(tradingDate, 3);
        } else if (weekday === 'Saturday') {
            tradingDate = addDays(tradingDate, 2);
        } else {
            // Sunday, Monday, Tue, Wed, Thu
            tradingDate = addDays(tradingDate, 1);
        }
    } else {
        // Weekend check if before 17:00
        if (weekday === 'Saturday') {
            tradingDate = addDays(tradingDate, 2);
        } else if (weekday === 'Sunday') {
            tradingDate = addDays(tradingDate, 1);
        }
    }

    // Format back to YYYY-MM-DD from the perspective of NY
    // This ensures consistency regardless of the browser's local timezone.
    const finalNyFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    
    const finalPartsArr = finalNyFormatter.formatToParts(tradingDate);
    const fp: Record<string, string> = {};
    finalPartsArr.forEach(p => fp[p.type] = p.value);
    
    // YYYY-MM-DD
    return `${fp.year}-${fp.month.padStart(2, '0')}-${fp.day.padStart(2, '0')}`;
}

/**
 * Returns the currently active Trading Day based on the 5:00 PM EST rollover.
 */
export function getCurrentTradingDay(): string {
    return getTradingDay(new Date());
}

/**
 * Helper to get a Date object representing the trading day.
 * Returns a date at midday to avoid any timezone-based day shifts in components.
 */
export function getTradingDayDate(date: Date | string): Date {
    const dayStr = (typeof date === 'string' && date.includes('-')) ? date : getTradingDay(date);
    const [y, m, d] = dayStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
}
