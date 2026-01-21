export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';

    // Parse if string to ensure number
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) return '$0';

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    }).format(num);
};

export const parseArgentine = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
};

// Helper to parse date ensuring LOCAL time for YYYY-MM-DD strings
export const parseSmartDate = (dateStr) => {
    if (!dateStr) return new Date();
    // If strict YYYY-MM-DD, parse as Local Midnight manually
    if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(dateStr); // Fallback for ISO strings
};

// Get current date string (YYYY-MM-DD) in Local Timezone
export const getLocalDateISOString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
};
