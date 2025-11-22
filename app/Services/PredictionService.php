<?php

namespace App\Services;

use App\Models\Prediction;
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

    // Rules depending on "title" (logical prediction type)
    protected array $titleRules = [
        // Profits: any numeric (positive or negative)
        'profits' => [
            'integer'        => false,
            'min'            => null,
            'max'            => null,
            'allow_negative' => true,
        ],

        // Student grade: 0 – 100
        'student_grade' => [
            'integer'        => false,
            'min'            => 0,
            'max'            => 100,
            'allow_negative' => false,
        ],

        // Customers count: integer, >= 1
        'customers_count' => [
            'integer'        => true,
            'min'            => 1,
            'max'            => null,
            'allow_negative' => false,
        ],
    ];

    public function __construct(PredictionRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Create new prediction
     */
    public function createPrediction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Logical prediction type (profits / student_grade / customers_count / ...)
            'title'           => 'required|string',
            'description'     => 'nullable|string',

            // Time dimension: weekly / monthly
            'prediction_type' => 'required|in:weekly,monthly',

            'values'               => 'required|array|min:2',
            'values.*.value'       => 'required|numeric',
            'values.*.period_date' => 'required|date|before_or_equal:today',

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

        // Sort values by date (oldest -> newest)
        $points = collect($data['values'])
            ->sortBy('period_date')
            ->values()
            ->all();

        // Extra validation based on title rules
        if ($errorResponse = $this->validateValuesByTitle($data['title'], $points)) {
            return $errorResponse;
        }

        // Only numeric series for prediction algorithm
        $series = array_map(fn ($item) => $item['value'], $points);

        $periodDates = array_map(fn ($item) => $item['period_date'], $points);
        $startDate   = min($periodDates);
        $lastDate    = max($periodDates);

        // 1) Create prediction row
        $prediction = $this->repo->create([
            'user_id'         => $request->user()->id,
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'prediction_type' => $data['prediction_type'], // weekly / monthly
            'future_steps'    => $data['future_steps'],
            'start_date'      => $startDate,
        ]);

        // 2) Store original values
        $this->storeOriginalValues(
            $prediction->id,
            $points
        );

        // 3) Predict future values
        $predictedValues = $this->predictTimeSeries(
            $series,
            $data['future_steps']
        );

        // 4) Store predicted results
        $results = $this->storePredictedResults(
            $prediction->id,
            $predictedValues,
            $data['prediction_type'],
            $lastDate,
            count($series)
        );

        // 5) Fetch original values from DB (sorted)
        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        // 6) Build labeled results for UI
        $labeledResults = $this->attachTimeLabels(
            $predictedValues,
            $data['prediction_type'],
            $lastDate
        );

        return $this->unifiedResponse(true, 'Prediction created successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * History: summary only (id, title, description, created_at)
     */
    public function history(int $userId)
    {
        $predictions = $this->repo->getUserPredictionsSummary($userId);

        return $this->unifiedResponse(true, 'Prediction history retrieved', $predictions);
    }

    /**
     * Show single prediction by id (same style as createPrediction response)
     */
    public function showPrediction(Request $request, int $id)
    {
        $userId = $request->user()->id;

        $prediction = Prediction::where('user_id', $userId)
            ->where('id', $id)
            ->first();

        if (!$prediction) {
            return $this->unifiedResponse(
                false,
                'Prediction not found',
                [],
                [],
                404
            );
        }

        // Original values
        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('period_date')
            ->orderBy('index')
            ->get();

        // Stored results
        $results = PredictionResult::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        $predictedValues = $results->pluck('predicted_value')->toArray();

        // Determine lastDate from original values
        if ($originalValues->count() > 0) {
            $lastDateString = $originalValues->max('period_date')->toDateString();
        } elseif ($prediction->start_date) {
            $lastDateString = $prediction->start_date->toDateString();
        } else {
            $lastDateString = now()->toDateString();
        }

        $labeledResults = $this->attachTimeLabels(
            $predictedValues,
            $prediction->prediction_type,
            $lastDateString
        );

        return $this->unifiedResponse(true, 'Prediction retrieved successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * Update prediction (meta + values) and recompute results when needed
     */
    public function updatePrediction(Request $request, int $id)
    {
        $userId     = $request->user()->id;

        $prediction = Prediction::where('user_id', $userId)
            ->where('id', $id)
            ->first();

        if (!$prediction) {
            return $this->unifiedResponse(
                false,
                'Prediction not found',
                [],
                [],
                404
            );
        }

        $validator = Validator::make($request->all(), [
            'title'           => 'sometimes|string',
            'description'     => 'sometimes|string',
            'prediction_type' => 'sometimes|in:weekly,monthly',

            'values'               => 'sometimes|array|min:2',
            'values.*.value'       => 'required_with:values|numeric',
            'values.*.period_date' => 'required_with:values|date|before_or_equal:today',

            'future_steps'    => 'sometimes|integer|min:1|max:12',
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

        $title          = $data['title']           ?? $prediction->title;
        $predictionType = $data['prediction_type'] ?? $prediction->prediction_type;
        $futureSteps    = $data['future_steps']    ?? $prediction->future_steps;

        $prediction->title           = $title;
        $prediction->prediction_type = $predictionType;
        $prediction->future_steps    = $futureSteps;

        if (array_key_exists('description', $data)) {
            $prediction->description = $data['description'];
        }

        // Do we need to recalc?
        $shouldRecalculate = isset($data['values'])
            || isset($data['prediction_type'])
            || isset($data['future_steps']);

        if ($shouldRecalculate) {
            // Build points (values + dates)
            if (isset($data['values'])) {
                // Using new values from request
                $points = collect($data['values'])
                    ->sortBy('period_date')
                    ->values()
                    ->all();
            } else {
                // Use existing values from DB
                $existingValues = PredictionValue::where('prediction_id', $prediction->id)
                    ->orderBy('period_date')
                    ->get(['value', 'period_date']);

                if ($existingValues->count() < 2) {
                    // Cannot recompute with less than 2 values
                    $prediction->save();

                    $results = PredictionResult::where('prediction_id', $prediction->id)
                        ->orderBy('index')
                        ->get();

                    $predictedValues = $results->pluck('predicted_value')->toArray();

                    $originalValues = PredictionValue::where('prediction_id', $prediction->id)
                        ->orderBy('period_date')
                        ->orderBy('index')
                        ->get();

                    $lastDateString = $originalValues->count()
                        ? $originalValues->max('period_date')->toDateString()
                        : ($prediction->start_date
                            ? $prediction->start_date->toDateString()
                            : now()->toDateString());

                    $labeledResults = $this->attachTimeLabels(
                        $predictedValues,
                        $prediction->prediction_type,
                        $lastDateString
                    );

                    return $this->unifiedResponse(true, 'Prediction updated successfully', [
                        'prediction'       => $prediction,
                        'original_values'  => $originalValues,
                        'raw_results'      => $results,
                        'labeled_results'  => $labeledResults,
                    ]);
                }

                $points = $existingValues
                    ->map(fn ($row) => [
                        'value'       => $row->value,
                        'period_date' => $row->period_date->toDateString(),
                    ])
                    ->all();
            }

            // Validate values according to title rules
            if ($errorResponse = $this->validateValuesByTitle($title, $points)) {
                return $errorResponse;
            }

            $series = array_map(fn ($item) => $item['value'], $points);
            $periodDates = array_map(fn ($item) => $item['period_date'], $points);
            $startDate   = min($periodDates);
            $lastDate    = max($periodDates);

            $prediction->start_date = $startDate;

            // If new values provided, reset values table
            if (isset($data['values'])) {
                PredictionValue::where('prediction_id', $prediction->id)->delete();
                $this->storeOriginalValues($prediction->id, $points);
            }

            // Always recompute results when recalc is needed
            PredictionResult::where('prediction_id', $prediction->id)->delete();

            $predictedValues = $this->predictTimeSeries($series, $futureSteps);
            $results = $this->storePredictedResults(
                $prediction->id,
                $predictedValues,
                $predictionType,
                $lastDate,
                count($series)
            );

            $prediction->save();

            $originalValues = PredictionValue::where('prediction_id', $prediction->id)
                ->orderBy('index')
                ->get();

            $labeledResults = $this->attachTimeLabels(
                $predictedValues,
                $predictionType,
                $lastDate
            );

            return $this->unifiedResponse(true, 'Prediction updated successfully', [
                'prediction'       => $prediction,
                'original_values'  => $originalValues,
                'raw_results'      => $results,
                'labeled_results'  => $labeledResults,
            ]);
        }

        // Only meta fields changed (title/description) => no recalculation
        $prediction->save();

        $results = PredictionResult::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        $predictedValues = $results->pluck('predicted_value')->toArray();

        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('period_date')
            ->orderBy('index')
            ->get();

        if ($originalValues->count() > 0) {
            $lastDateString = $originalValues->max('period_date')->toDateString();
        } elseif ($prediction->start_date) {
            $lastDateString = $prediction->start_date->toDateString();
        } else {
            $lastDateString = now()->toDateString();
        }

        $labeledResults = $this->attachTimeLabels(
            $predictedValues,
            $prediction->prediction_type,
            $lastDateString
        );

        return $this->unifiedResponse(true, 'Prediction updated successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * Delete prediction completely
     */
    public function deletePrediction(Request $request, int $id)
    {
        $userId = $request->user()->id;

        $prediction = Prediction::where('user_id', $userId)
            ->where('id', $id)
            ->first();

        if (!$prediction) {
            return $this->unifiedResponse(
                false,
                'Prediction not found',
                [],
                [],
                404
            );
        }

        // Cascade delete (children have onDelete('cascade'))
        $prediction->delete();

        return $this->unifiedResponse(true, 'Prediction deleted successfully');
    }

    /**
     * Extra validation according to title rules
     */
    protected function validateValuesByTitle(string $title, array $points)
    {
        if (!array_key_exists($title, $this->titleRules)) {
            return null;
        }

        $rule   = $this->titleRules[$title];
        $errors = [];

        foreach ($points as $index => $item) {
            $value = $item['value'];

            if (!$rule['allow_negative'] && $value < 0) {
                $errors["values.$index.value"][] = 'Negative values are not allowed for this type.';
            }

            if ($rule['min'] !== null && $value < $rule['min']) {
                $errors["values.$index.value"][] = 'Value must be greater than or equal to ' . $rule['min'] . '.';
            }

            if ($rule['max'] !== null && $value > $rule['max']) {
                $errors["values.$index.value"][] = 'Value must be less than or equal to ' . $rule['max'] . '.';
            }

            if ($rule['integer'] === true && floor($value) != $value) {
                $errors["values.$index.value"][] = 'Value must be an integer for this type.';
            }
        }

        if (!empty($errors)) {
            return $this->unifiedResponse(
                false,
                'Value validation error for title: ' . $title,
                [],
                $errors,
                422
            );
        }

        return null;
    }

    /**
     * Store original values
     */
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

    /**
     * Store future results
     */
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

    /**
     * Build labels for UI
     */
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
                $label = $date->format('Y-m');
            } else {
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

    /**
     * Future date according to prediction_type
     */
    protected function getFutureDate(string $predictionType, Carbon $lastDate, int $step): Carbon
    {
        if ($predictionType === 'monthly') {
            return $lastDate->copy()->addMonths($step);
        }

        return $lastDate->copy()->addWeeks($step);
    }

    /**
     * Multi-step prediction with moving window of last N values
     */
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

    /**
     * Detect if window is monotonic (trend) or fluctuating
     */
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

    /**
     * Next value using moving average
     */
    protected function calculateNextWithAverage(array $window): float
    {
        if (count($window) === 0) {
            return 0;
        }

        $sum = array_sum($window);
        $avg = $sum / count($window);

        return $avg;
    }

    /**
     * Next value using trend (slope)
     */
    protected function calculateNextWithTrend(array $window): float
    {
        if (count($window) < 2) {
            return end($window) ?: 0;
        }

        $diffs = [];
        for ($j = 1; $j < count($window); $j++) {
            $diffs[] = $window[$j] - $window[$j - 1];
        }

        $slope = array_sum($diffs) / count($diffs);
        $last  = end($window);

        return $last + $slope;
    }
}
