// src/components/PeriodsSelector.js
import React, { useState, useEffect } from 'react';
import {
    Select,
    FormControl,
    FormLabel,
    Text,
    useToast,
    HStack,
    Spinner,
} from '@chakra-ui/react';
import { useAuth } from 'contexts/AuthContext';

const PeriodsSelector = ({
                             scopeType,
                             scopeId,
                             metric,
                             periodType,
                             onPeriodsChange,
                             value,
                             onChange
                         }) => {
    const { apiRequest } = useAuth();
    const toast = useToast();
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (scopeType && scopeId && metric && periodType) {
            fetchAvailablePeriods();
        } else {
            setPeriods([]);
        }
    }, [scopeType, scopeId, metric, periodType]);

    const fetchAvailablePeriods = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(`/predict/periods?scope_type=${scopeType}&scope_id=${scopeId}&metric=${metric}&period_type=${periodType}`, {
                method: 'GET',
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setPeriods(result.data.periods);
                    if (onPeriodsChange) {
                        onPeriodsChange(result.data.periods);
                    }
                } else {
                    throw new Error(result.message || 'Failed to fetch periods');
                }
            } else {
                throw new Error('Failed to fetch periods');
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch available periods',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const getPeriodLabel = (period) => {
        if (!period) return 'No data';

        if (periodType === 'monthly') {
            const date = new Date(period.date);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        } else if (periodType === 'yearly') {
            return period.label || period.date;
        }

        return period.label || period.date;
    };

    return (
        <FormControl>
            <FormLabel>Available Periods</FormLabel>
            {loading ? (
                <HStack>
                    <Spinner size="sm" color="teal.500" />
                    <Text>Loading periods...</Text>
                </HStack>
            ) : periods.length > 0 ? (
                <Select
                    value={value}
                    onChange={onChange}
                    placeholder="Select a period"
                >
                    {periods.map((period, index) => (
                        <option key={index} value={period.date}>
                            {getPeriodLabel(period)}
                        </option>
                    ))}
                </Select>
            ) : (
                <Text color="gray.500">No periods available</Text>
            )}
        </FormControl>
    );
};

export default PeriodsSelector;