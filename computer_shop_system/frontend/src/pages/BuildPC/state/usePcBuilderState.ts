import { useMemo, useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import type { SelectedParts } from '../types';
import type { Product } from '../../../types/product.types';
import { EMPTY_SELECTED } from '../types';
import { aggregateCompatibility } from '../utils/compatibility';
import { computeTotals } from '../utils/totals';
import { promotionService } from '../../../services/promotion.service';

const LS_KEY = 'pc_builder_state_v1';

export const usePcBuilderState = () => {
    const [selectedParts, setSelectedParts, resetStorage] = useLocalStorage<SelectedParts>(LS_KEY, EMPTY_SELECTED);
    const [discount, setDiscount] = useState(0);
    const [loadingDiscount, setLoadingDiscount] = useState(false);

    const warnings = useMemo(() => aggregateCompatibility(selectedParts), [selectedParts]);
    const totals = useMemo(() => computeTotals(selectedParts, 0.1, discount), [selectedParts, discount]);

    // Recompute promotion discount when selected parts change
    useEffect(() => {
        const ids = Object.values(selectedParts).filter(Boolean).map(p => (p as Product).id);
        const subtotal = Object.values(selectedParts).reduce((sum, p) => sum + ((p as Product | null)?.price ?? 0), 0);
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
    }, [selectedParts]);

    const selectPart = useCallback((key: keyof SelectedParts, product: Product | null) => {
        setSelectedParts(prev => ({ ...prev, [key]: product }));
    }, [setSelectedParts]);

    const removePart = useCallback((key: keyof SelectedParts) => {
        setSelectedParts(prev => ({ ...prev, [key]: null }));
    }, [setSelectedParts]);

    const reset = useCallback(() => {
        resetStorage();
    }, [resetStorage]);

    return {
        selectedParts,
        warnings,
        totals,
        loadingDiscount,
        actions: { selectPart, removePart, reset },
    } as const;
};
