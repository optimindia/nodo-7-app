import {
    startOfDay, endOfDay,
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfYear, endOfYear,
    subDays, subMonths,
    isWithinInterval, parseISO
} from 'date-fns';

export const DATE_RANGES = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    LAST_3_MONTHS: '3m',
    LAST_6_MONTHS: '6m',
    YEAR: 'year',
    ALL: 'all'
};

export const getDateRangeInterval = (rangeType) => {
    const now = new Date();

    switch (rangeType) {
        case DATE_RANGES.TODAY:
            return { start: startOfDay(now), end: endOfDay(now) };
        case DATE_RANGES.WEEK:
            return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }; // Monday start
        case DATE_RANGES.MONTH:
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case DATE_RANGES.LAST_3_MONTHS:
            return { start: subMonths(now, 3), end: endOfDay(now) };
        case DATE_RANGES.LAST_6_MONTHS:
            return { start: subMonths(now, 6), end: endOfDay(now) };
        case DATE_RANGES.YEAR:
            return { start: startOfYear(now), end: endOfYear(now) };
        case DATE_RANGES.ALL:
            return { start: new Date(0), end: endOfDay(now) }; // Beginning of time
        default:
            return { start: startOfMonth(now), end: endOfMonth(now) };
    }
};

export const filterTransactionsByRange = (transactions, rangeType) => {
    if (!transactions || transactions.length === 0) return [];

    const { start, end } = getDateRangeInterval(rangeType);

    return transactions.filter(tx => {
        const txDate = parseISO(tx.date || tx.created_at); // Handle both date formats if present
        return isWithinInterval(txDate, { start, end });
    });
};

export const filterTransactionsByWallet = (transactions, walletId) => {
    if (!walletId || walletId === 'all') return transactions;
    return transactions.filter(tx => tx.wallet_id === walletId);
};
