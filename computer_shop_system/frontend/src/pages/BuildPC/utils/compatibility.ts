import type { Product } from '../../../types/product.types';
import type { CompatibilityIssue, SelectedParts } from '../types';

// Safe getters for typical specification fields used in compatibility
const getSpec = (p: Product | null | undefined, key: string): unknown => {
    if (!p) return undefined;
    try {
        const specs = p.specifications as Record<string, unknown> | undefined;
        return specs ? (specs as Record<string, unknown>)[key] : undefined;
    } catch {
        return undefined;
    }
};

export const checkCpuMainboardSocket = (cpu: Product | null, mainboard: Product | null): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const cpuSocket = String(getSpec(cpu, 'socket') ?? '').toUpperCase();
    const mbSocket = String(getSpec(mainboard, 'socket') ?? getSpec(mainboard, 'cpu_socket') ?? '').toUpperCase();
    if (cpu && mainboard && cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        issues.push({
            code: 'CPU_MB_SOCKET_MISMATCH',
            message: `Socket CPU (${cpuSocket}) không khớp với Mainboard (${mbSocket}).`,
            severity: 'error',
            related: ['cpu', 'mainboard'],
        });
    }
    return issues;
};

export const checkRamType = (ram: Product | null, mainboard: Product | null): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const ramType = String(getSpec(ram, 'type') ?? getSpec(ram, 'ram_type') ?? '').toUpperCase();
    const mbRam = String(getSpec(mainboard, 'memory_type') ?? getSpec(mainboard, 'ram_type') ?? '').toUpperCase();
    if (ram && mainboard && ramType && mbRam && ramType !== mbRam) {
        issues.push({
            code: 'RAM_TYPE_MISMATCH',
            message: `RAM (${ramType}) không tương thích với Mainboard (${mbRam}).`,
            severity: 'error',
            related: ['ram1', 'mainboard'],
        });
    }
    return issues;
};

export const checkPsuWattage = (psu: Product | null, cpu: Product | null, gpu: Product | null, headroom = 150): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const psuWatt = Number(getSpec(psu, 'wattage') ?? getSpec(psu, 'power') ?? 0);
    const cpuTdp = Number(getSpec(cpu, 'tdp') ?? 65);
    const gpuTdp = Number(getSpec(gpu, 'tdp') ?? getSpec(gpu, 'power') ?? 0);
    if (psu && (cpu || gpu)) {
        const need = cpuTdp + gpuTdp + headroom;
        if (psuWatt && need > psuWatt) {
            issues.push({
                code: 'PSU_INSUFFICIENT',
                message: `Công suất PSU (${psuWatt}W) có thể không đủ (khuyến nghị ≥ ${need}W).`,
                severity: 'warning',
                related: ['psu', 'cpu', 'gpu'],
            });
        }
    }
    return issues;
};

export const checkCaseFit = (pcCase: Product | null, gpu: Product | null, mainboard: Product | null): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const maxGpuLength = Number(getSpec(pcCase, 'max_gpu_length') ?? 0);
    const gpuLength = Number(getSpec(gpu, 'length') ?? getSpec(gpu, 'gpu_length') ?? 0);
    if (pcCase && gpu && maxGpuLength && gpuLength && gpuLength > maxGpuLength) {
        issues.push({
            code: 'GPU_TOO_LONG',
            message: `Card đồ họa (${gpuLength}mm) dài hơn giới hạn của case (${maxGpuLength}mm).`,
            severity: 'warning',
            related: ['case', 'gpu'],
        });
    }
    // Optionally MB form factor
    const form = String(getSpec(mainboard, 'form_factor') ?? '').toUpperCase();
    const supported = String(getSpec(pcCase, 'supported_mb') ?? '').toUpperCase();
    if (pcCase && mainboard && form && supported && !supported.includes(form)) {
        issues.push({
            code: 'CASE_MB_FORM_FACTOR',
            message: `Case có thể không hỗ trợ mainboard dạng ${form}.`,
            severity: 'info',
            related: ['case', 'mainboard'],
        });
    }
    return issues;
};

export const aggregateCompatibility = (parts: SelectedParts): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    issues.push(
        ...checkCpuMainboardSocket(parts.cpu, parts.mainboard),
        // Check both RAM slots independently
        ...checkRamType(parts.ram1, parts.mainboard).map(issue => ({ ...issue, related: ['ram1', 'mainboard'] } as CompatibilityIssue)),
        ...checkRamType(parts.ram2, parts.mainboard).map(issue => ({ ...issue, related: ['ram2', 'mainboard'] } as CompatibilityIssue)),
        ...checkPsuWattage(parts.psu, parts.cpu, parts.gpu),
        ...checkCaseFit(parts.case, parts.gpu, parts.mainboard)
    );
    return issues;
};
