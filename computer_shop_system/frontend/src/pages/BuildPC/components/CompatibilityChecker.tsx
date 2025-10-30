import React from 'react';
import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import type { CompatibilityIssue, SelectedParts } from '../types';

interface Props {
    selectedParts: SelectedParts;
    warnings: CompatibilityIssue[];
}

export const CompatibilityChecker: React.FC<Props> = ({ warnings }) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Kiểm tra tương thích
                </Typography>
                {warnings.length === 0 ? (
                    <Alert severity="success">Chưa phát hiện vấn đề nào.</Alert>
                ) : (
                    <Stack spacing={1.5}>
                        {warnings.map((w, idx) => (
                            <Alert key={idx} severity={w.severity === 'error' ? 'error' : w.severity === 'warning' ? 'warning' : 'info'}>
                                {w.message}
                            </Alert>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};
