<?php

namespace App\Services;

class PredictionService
{
    /**
     * خوارزمية بسيطة تعتمد على الميل (trend) بين القيم
     * لو الميل ثابت → استمرار نفس الزيادة أو النقص
     * لو القيم متقلبة → استخدام المتوسط الحسابي
     */
    public function predict(array $values, int $steps = 3): array
    {
        $count = count($values);
        if ($count < 2) return [];

        $diffs = [];
        for ($i = 1; $i < $count; $i++) {
            $diffs[] = $values[$i] - $values[$i - 1];
        }

        $avgDiff = array_sum($diffs) / count($diffs);

        $predictions = [];
        $lastValue = end($values);

        for ($i = 1; $i <= $steps; $i++) {
            $predictions[] = round($lastValue + $avgDiff * $i, 2);
        }

        return $predictions;
    }
}
