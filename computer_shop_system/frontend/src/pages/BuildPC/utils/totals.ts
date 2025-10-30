import type { SelectedParts, PriceTotals } from '../types';

export const computeTotals = (selected: SelectedParts, taxRate = 0.1, discount = 0): PriceTotals => {
    const subtotal = Object.values(selected).reduce((sum, p) => sum + (p?.price ?? 0), 0);
    const clampedDiscount = Math.min(discount, subtotal);
    const taxable = Math.max(subtotal - clampedDiscount, 0);
    const tax = Math.round(taxable * taxRate);
    const total = Math.max(taxable + tax, 0);
    return { subtotal, discount: clampedDiscount, tax, total };
};
