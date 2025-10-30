import type { Product } from '../../types/product.types';

export type PartKey =
    | 'cpu'
    | 'mainboard'
    | 'ram1'
    | 'ram2'
    | 'ssd1'
    | 'ssd2'
    | 'hdd'
    | 'gpu'
    | 'psu'
    | 'case'
    | 'cooler_air'
    | 'cooler_water'
    | 'case_fan1'
    | 'case_fan2';

export type SelectedParts = Record<PartKey, Product | null>;

export interface PriceTotals {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
}

export type IssueSeverity = 'info' | 'warning' | 'error';

export interface CompatibilityIssue {
    code: string;
    message: string;
    severity: IssueSeverity;
    related: PartKey[];
}

export interface PCBuildState {
    selectedParts: SelectedParts;
    totals: PriceTotals;
    warnings: CompatibilityIssue[];
}

export const EMPTY_SELECTED: SelectedParts = {
    cpu: null,
    mainboard: null,
    ram1: null,
    ram2: null,
    ssd1: null,
    ssd2: null,
    hdd: null,
    gpu: null,
    psu: null,
    case: null,
    cooler_air: null,
    cooler_water: null,
    case_fan1: null,
    case_fan2: null,
};
