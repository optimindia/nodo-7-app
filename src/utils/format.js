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
