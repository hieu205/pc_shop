import type { Category } from '../../../types/product.types';
import type { PartKey } from '../types';

const KEY_TO_SLUG: Record<PartKey, string[]> = {
    cpu: ['cpu', 'processor'],
    mainboard: ['mainboard', 'motherboard', 'mb'],
    ram1: ['ram', 'memory'],
    ram2: ['ram', 'memory'],
    ssd1: ['ssd', 'storage', 'drive'],
    ssd2: ['ssd', 'storage', 'drive'],
    hdd: ['hdd', 'storage', 'drive'],
    gpu: ['gpu', 'vga', 'graphics-card', 'graphics'],
    psu: ['psu', 'power-supply', 'nguon'],
    case: ['case', 'vo-may', 'pc-case'],
    cooler_air: ['cooler', 'air-cooler', 'tan-nhiet-khi', 'cpu-cooler'],
    cooler_water: ['aio', 'liquid', 'water-cooler', 'tan-nhiet-nuoc'],
    case_fan1: ['case-fan', 'fan', 'case-fans'],
    case_fan2: ['case-fan', 'fan', 'case-fans'],
};

const normalize = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, '-');

export const resolveCategoryIdByKey = (key: PartKey, categories: Category[]): number | null => {
    const targets = KEY_TO_SLUG[key] || [];
    // 1) exact slug match
    for (const c of categories) {
        const slug = normalize(c.slug || c.name);
        if (targets.includes(slug)) return c.id;
    }
    // 2) name contains
    for (const c of categories) {
        const slug = normalize(c.slug || c.name);
        if (targets.some(t => slug.includes(t))) return c.id;
    }
    return null;
};
