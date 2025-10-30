import { useMemo, useCallback, useEffect, useState } from 'react';
// Lightweight UUID v4 generator to avoid external deps
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
import type { SelectedParts } from '../types';
import { EMPTY_SELECTED } from '../types';
import type { Product } from '../../../types/product.types';
import { aggregateCompatibility } from '../utils/compatibility';
import { computeTotals } from '../utils/totals';
import { promotionService } from '../../../services/promotion.service';

type BuildConfig = {
    id: string;
    name: string;
    selectedParts: SelectedParts;
};

type MultiState = {
    configs: BuildConfig[];
    activeId: string;
};

const LS_MULTI_KEY = 'pc_builder_multi_v1';
const LS_SINGLE_KEY = 'pc_builder_state_v1';

const createDefaultConfigs = (count = 3): BuildConfig[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: uuidv4(),
        name: `Cấu hình ${i + 1}`,
        selectedParts: { ...EMPTY_SELECTED },
    }));
};

export const usePcBuilderMultiState = () => {
    // Initialize from localStorage with migration from single-state if present
    const [state, setState] = useState<MultiState>(() => {
        try {
            const raw = localStorage.getItem(LS_MULTI_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as MultiState;
                if (parsed?.configs?.length) return parsed;
            }
            // Migrate from single-state
            const single = localStorage.getItem(LS_SINGLE_KEY);
            if (single) {
                try {
                    const selected = JSON.parse(single) as SelectedParts;
                    const cfg: BuildConfig = { id: uuidv4(), name: 'Cấu hình 1', selectedParts: selected || { ...EMPTY_SELECTED } };
                    const migrated: MultiState = { configs: [cfg], activeId: cfg.id };
                    localStorage.setItem(LS_MULTI_KEY, JSON.stringify(migrated));
                    // Optional: keep single-state for backward compatibility; do not remove
                    return migrated;
                } catch { }
            }
            // Default: create 3 empty configs
            const defaults = createDefaultConfigs(3);
            const initial: MultiState = { configs: defaults, activeId: defaults[0].id };
            localStorage.setItem(LS_MULTI_KEY, JSON.stringify(initial));
            return initial;
        } catch {
            const defaults = createDefaultConfigs(3);
            return { configs: defaults, activeId: defaults[0].id };
        }
    });

    const persist = useCallback((next: MultiState) => {
        setState(next);
        try { localStorage.setItem(LS_MULTI_KEY, JSON.stringify(next)); } catch { }
    }, []);

    const activeIndex = useMemo(() => state.configs.findIndex(c => c.id === state.activeId), [state]);
    const active = useMemo(() => state.configs[activeIndex] || state.configs[0], [state, activeIndex]);

    // Derived values for active config
    const warnings = useMemo(() => aggregateCompatibility(active.selectedParts), [active.selectedParts]);
    const [discount, setDiscount] = useState(0);
    const [loadingDiscount, setLoadingDiscount] = useState(false);
    const totals = useMemo(() => computeTotals(active.selectedParts, 0.1, discount), [active.selectedParts, discount]);

    // Recompute promotion discount when active selection changes
    useEffect(() => {
        const ids = Object.values(active.selectedParts).filter(Boolean).map(p => (p as Product).id);
        const subtotal = Object.values(active.selectedParts).reduce((sum, p) => sum + ((p as Product | null)?.price ?? 0), 0);
        if (ids.length === 0) { setDiscount(0); return; }
        let cancelled = false;
        setLoadingDiscount(true);
        (async () => {
            try {
                const best = await promotionService.getBest(ids, subtotal);
                if (!best) { if (!cancelled) setDiscount(0); return; }
                const result = await promotionService.calculateDiscount(best.id, ids, subtotal);
                if (!cancelled) setDiscount(result.amount);
            } catch (e) {
                if (!cancelled) setDiscount(0);
            } finally {
                if (!cancelled) setLoadingDiscount(false);
            }
        })();
        return () => { cancelled = true; };
    }, [active.selectedParts]);

    // Actions on active selection
    const selectPart = useCallback((key: keyof SelectedParts, product: Product | null) => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...cfg.selectedParts, [key]: product } } : cfg);
        persist({ configs: nextConfigs, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    const removePart = useCallback((key: keyof SelectedParts) => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...cfg.selectedParts, [key]: null } } : cfg);
        persist({ configs: nextConfigs, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    const resetActive = useCallback(() => {
        const nextConfigs = state.configs.map((cfg, idx) => idx === activeIndex ? { ...cfg, selectedParts: { ...EMPTY_SELECTED } } : cfg);
        persist({ configs: nextConfigs, activeId: state.activeId });
    }, [state, activeIndex, persist]);

    // Config list actions
    const setActive = useCallback((id: string) => {
        if (id === state.activeId) return;
        if (!state.configs.some(c => c.id === id)) return;
        persist({ configs: state.configs, activeId: id });
    }, [state, persist]);

    const addConfig = useCallback((name?: string) => {
        const newCfg: BuildConfig = { id: uuidv4(), name: name || `Cấu hình ${state.configs.length + 1}`, selectedParts: { ...EMPTY_SELECTED } };
        persist({ configs: [...state.configs, newCfg], activeId: newCfg.id });
    }, [state, persist]);

    const renameConfig = useCallback((id: string, name: string) => {
        const next = state.configs.map(c => c.id === id ? { ...c, name } : c);
        persist({ configs: next, activeId: state.activeId });
    }, [state, persist]);

    const removeConfig = useCallback((id: string) => {
        if (state.configs.length <= 1) return; // always keep at least 1
        const next = state.configs.filter(c => c.id !== id);
        const nextActive = state.activeId === id ? next[0].id : state.activeId;
        persist({ configs: next, activeId: nextActive });
    }, [state, persist]);

    return {
        // list & active
        configs: state.configs,
        activeId: state.activeId,
        active,
        setActive,
        addConfig,
        renameConfig,
        removeConfig,

        // active selection derived
        selectedParts: active.selectedParts,
        warnings,
        totals,
        loadingDiscount,
        actions: {
            selectPart,
            removePart,
            reset: resetActive,
        },
    } as const;
};
