<?php

namespace App\Services;

use App\Models\PredictionValue;
use App\Models\PredictionResult;
use App\Repositories\PredictionRepository;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PredictionService
{
    use ApiResponseTrait;

    protected $repo;

    public function __construct(PredictionRepository $repo)
    {
        $this->repo = $repo;
    }

    public function createPrediction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'           => 'required|string',
            'description'     => 'nullable|string',
            'prediction_type' => 'required|in:weekly,monthly',
            'values'          => 'required|array|min:2',
            'values.*.value'       => 'required|numeric',
            'values.*.period_date' => 'required|date',
            'future_steps'    => 'required|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                $validator->errors(),
                422
            );
        }

        $data = $validator->validated();

        $points = collect($data['values'])
            ->sortBy('period_date')
            ->values()
            ->all();

        $series = array_map(fn ($item) => $item['value'], $points);

        $periodDates = array_map(fn ($item) => $item['period_date'], $points);
        $startDate   = min($periodDates);
        $lastDate    = max($periodDates);

        $prediction = $this->repo->create([
            'user_id'         => $request->user()->id,
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'prediction_type' => $data['prediction_type'], // weekly / monthly
            'future_steps'    => $data['future_steps'],
            'start_date'      => $startDate,
        ]);

        $this->storeOriginalValues(
            $prediction->id,
            $points
        );

        $predictedValues = $this->predictTimeSeries(
            $series,
            $data['future_steps']
        );

        $results = $this->storePredictedResults(
            $prediction->id,
            $predictedValues,
            $data['prediction_type'],
            $lastDate,
            count($series)
        );

        $labeledResults = $this->attachTimeLabels(
            $predictedValues,
            $data['prediction_type'],
            $lastDate
        );

        return $this->unifiedResponse(true, 'Prediction completed successfully', [
            'prediction'      => $prediction,
            'raw_results'     => $results,
            'labeled_results' => $labeledResults,
        ]);
    }


    public function history(int $userId)
    {
        $predictions = $this->repo->getUserPredictions($userId);

        return $this->unifiedResponse(true, 'Prediction history retrieved', $predictions);
    }


    protected function storeOriginalValues(int $predictionId, array $points): void
    {
        foreach ($points as $index => $item) {
            PredictionValue::create([
                'prediction_id' => $predictionId,
                'index'         => $index + 1,
                'value'         => $item['value'],
                'period_date'   => $item['period_date'],
            ]);
        }
    }


    protected function storePredictedResults(
        int $predictionId,
        array $predictedValues,
        string $predictionType,
        string $lastDateString,
        int $existingCount
    ): array {
        $results  = [];
        $lastDate = Carbon::parse($lastDateString);

        foreach ($predictedValues as $i => $value) {
            $step = $i + 1;

            $periodDate = $this->getFutureDate(
                $predictionType,
                $lastDate,
                $step
            );

            $result = PredictionResult::create([
                'prediction_id'   => $predictionId,
                'index'           => $existingCount + $step,
                'predicted_value' => $value,
                'period_date'     => $periodDate,
            ]);

            $results[] = $result;
        }

        return $results;
    }


    protected function attachTimeLabels(
        array $predictedValues,
        string $predictionType,
        string $lastDateString
    ): array {
        $labels   = [];
        $lastDate = Carbon::parse($lastDateString);

        foreach ($predictedValues as $i => $value) {
            $step = $i + 1;
            $date = $this->getFutureDate($predictionType, $lastDate, $step);

            if ($predictionType === 'monthly') {
                $label = $date->format('Y-m'); // مثلا: 2025-03
            } else {
                // weekly
                $label = 'Week ' . $date->weekOfYear . ' - ' . $date->year;
            }

            $labels[] = [
                'label' => $label,
                'date'  => $date->toDateString(),
                'value' => $value,
            ];
        }

        return $labels;
    }


    protected function getFutureDate(string $predictionType, Carbon $lastDate, int $step): Carbon
    {
        if ($predictionType === 'monthly') {
            return $lastDate->copy()->addMonths($step);
        }

        // weekly
        return $lastDate->copy()->addWeeks($step);
    }



    protected function predictTimeSeries(array $values, int $steps): array
    {
        if (count($values) < 2 || $steps < 1) {
            return [];
        }

        $windowSize = count($values);
        $sequence   = array_values($values);
        $predicted  = [];

        for ($i = 0; $i < $steps; $i++) {
            $window = array_slice($sequence, -$windowSize);

            $trendType = $this->detectTrendType($window);

            if ($trendType === 'trend') {
                $next = $this->calculateNextWithTrend($window);
            } else {
                $next = $this->calculateNextWithAverage($window);
            }

            $next = round($next, 2);

            $predicted[] = $next;
            $sequence[]  = $next;
        }

        return $predicted;
    }

    protected function detectTrendType(array $values): string
    {
        if (count($values) < 2) {
            return 'fluctuating';
        }

        $diffs = [];

        for ($i = 1; $i < count($values); $i++) {
            $diffs[] = $values[$i] - $values[$i - 1];
        }

        $hasPositive = false;
        $hasNegative = false;

        foreach ($diffs as $d) {
            if ($d > 0) {
                $hasPositive = true;
            } elseif ($d < 0) {
                $hasNegative = true;
            }
        }

        if ($hasPositive && !$hasNegative) {
            return 'trend';
        }

        if ($hasNegative && !$hasPositive) {
            return 'trend';
        }

        return 'fluctuating';
    }



    protected function calculateNextWithAverage(array $window): float
    {
        if (count($window) === 0) {
            return 0;
        }

        $sum = array_sum($window);
        $avg = $sum / count($window);

        return $avg;
    }

    
    protected function calculateNextWithTrend(array $window): float
    {
        if (count($window) < 2) {
            return end($window) ?: 0;
        }

        $diffs = [];
        for ($i = 1; $i < count($window); $i++) {
            $diffs[] = $window[$i] - $window[$i - 1];
        }

        $slope = array_sum($diffs) / count($diffs);
        $last  = end($window);

        return $last + $slope;
    }

}


