<?php

namespace App\Services;

use App\Models\College;
use App\Models\CollegeYearStat;
use App\Models\CollegeMonthExpense;
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

    protected int $minPoints = 3;

    public function __construct(PredictionRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Create new prediction based on stored stats (not raw user values)
     */
    public function createPrediction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'        => 'nullable|string',
            'description'  => 'nullable|string',

            'scope_type'   => 'required|in:college,university',
            'scope_id'     => 'required_if:scope_type,college|nullable|exists:colleges,id',

            'metric'       => 'required|in:revenue,expenses,profit,students',
            'period_type'  => 'required|in:yearly,monthly',

            'future_steps' => 'required|integer|min:1|max:20',
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

        // Validate allowed combinations
        if ($data['period_type'] === 'yearly' && in_array($data['metric'], ['expenses', 'profit'])) {
            return $this->unifiedResponse(
                false,
                'Invalid combination: expenses/profit are only supported with monthly period_type.',
                [],
                [],
                422
            );
        }

        if ($data['period_type'] === 'monthly' && $data['metric'] === 'students') {
            return $this->unifiedResponse(
                false,
                'Invalid combination: students metric is only supported with yearly period_type.',
                [],
                [],
                422
            );
        }

        // Build historical series from stats
        $series = $this->buildSeries(
            $data['scope_type'],
            $data['scope_type'] === 'college' ? $data['scope_id'] : null,
            $data['metric'],
            $data['period_type']
        );

        if (count($series['values']) < $this->minPoints) {
            return $this->unifiedResponse(
                false,
                'At least ' . $this->minPoints . ' historical data points are required for prediction.',
                [],
                [],
                422
            );
        }

        $values     = $series['values'];     // numeric array
        $periods    = $series['periods'];    // Carbon[]
        $startDate  = $periods[0]->toDateString();
        $lastPeriod = end($periods);

        // 1) Create prediction record
        $prediction = $this->repo->create([
            'user_id'      => $request->user()->id,
            'scope_type'   => $data['scope_type'],
            'scope_id'     => $data['scope_type'] === 'college' ? $data['scope_id'] : null,
            'title'        => $data['title'] ?? ($data['metric'] . ' ' . $data['period_type']),
            'description'  => $data['description'] ?? null,
            'metric'       => $data['metric'],
            'period_type'  => $data['period_type'],
            'future_steps' => $data['future_steps'],
            'start_date'   => $startDate,
        ]);

        // 2) Store original values snapshot
        $this->storeOriginalValuesFromSeries($prediction->id, $values, $periods);

        // 3) Predict future values (raw)
        $predictedValues = $this->predictTimeSeries($values, $data['future_steps']);

        //  apply capacity bounds to each predicted value
        $boundedPredictedValues = [];
        foreach ($predictedValues as $v) {
            $boundedPredictedValues[] = $this->applyBounds(
                $data['metric'],
                $data['scope_type'],
                $data['scope_type'] === 'college' ? $data['scope_id'] : null,
                (float) $v
            );
        }

        // 4) Store prediction results (using bounded values)
        $results = $this->storePredictedResults(
            $prediction->id,
            $boundedPredictedValues,
            $data['period_type'],
            $lastPeriod,
            count($values)
        );

        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        $labeledResults = $this->attachTimeLabels(
            $boundedPredictedValues,
            $data['period_type'],
            $lastPeriod
        );

        return $this->unifiedResponse(true, 'Prediction created successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * Get history summary
     */
    public function history(int $userId)
    {
        $predictions = $this->repo->getUserPredictionsSummary($userId);

        return $this->unifiedResponse(true, 'Prediction history retrieved', $predictions);
    }

    /**
     * Show single prediction with details
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

        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('period_date')
            ->orderBy('index')
            ->get();

        $results = PredictionResult::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        $predictedValues = $results->pluck('predicted_value')->toArray();

        if ($originalValues->count() > 0) {
            $lastDate = Carbon::parse($originalValues->max('period_date'));
        } elseif ($prediction->start_date) {
            $lastDate = Carbon::parse($prediction->start_date);
        } else {
            $lastDate = now();
        }

        $labeledResults = $this->attachTimeLabels(
            $predictedValues,
            $prediction->period_type,
            $lastDate
        );

        return $this->unifiedResponse(true, 'Prediction retrieved successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * Update prediction meta and recompute using current stats
     */
    public function updatePrediction(Request $request, int $id)
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

        $validator = Validator::make($request->all(), [
            'title'        => 'sometimes|string',
            'description'  => 'sometimes|string',
            'future_steps' => 'sometimes|integer|min:1|max:20',
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

        if (array_key_exists('title', $data)) {
            $prediction->title = $data['title'];
        }

        if (array_key_exists('description', $data)) {
            $prediction->description = $data['description'];
        }

        if (array_key_exists('future_steps', $data)) {
            $prediction->future_steps = $data['future_steps'];
        }

        // Rebuild series from stats
        $series = $this->buildSeries(
            $prediction->scope_type,
            $prediction->scope_type === 'college' ? $prediction->scope_id : null,
            $prediction->metric,
            $prediction->period_type
        );

        if (count($series['values']) <  $this->minPoints) {
            return $this->unifiedResponse(
                false,
                'At least ' . $this->minPoints . ' historical data points are required to recompute the prediction.',
                [],
                [],
                422
            );
        }

        $values     = $series['values'];
        $periods    = $series['periods'];
        $startDate  = $periods[0]->toDateString();
        $lastPeriod = end($periods);

        $prediction->start_date = $startDate;
        $prediction->save();

        // Reset original snapshot
        PredictionValue::where('prediction_id', $prediction->id)->delete();
        $this->storeOriginalValuesFromSeries($prediction->id, $values, $periods);

        // Reset and recompute results
        PredictionResult::where('prediction_id', $prediction->id)->delete();

        $predictedValues = $this->predictTimeSeries($values, $prediction->future_steps);

        $boundedPredictedValues = [];
        foreach ($predictedValues as $v) {
            $boundedPredictedValues[] = $this->applyBounds(
                $prediction->metric,
                $prediction->scope_type,
                $prediction->scope_type === 'college' ? $prediction->scope_id : null,
                (float) $v
            );
        }

        $results = $this->storePredictedResults(
            $prediction->id,
            $boundedPredictedValues,
            $prediction->period_type,
            $lastPeriod,
            count($values)
        );

        $originalValues = PredictionValue::where('prediction_id', $prediction->id)
            ->orderBy('index')
            ->get();

        $labeledResults = $this->attachTimeLabels(
            $boundedPredictedValues,
            $prediction->period_type,
            $lastPeriod
        );

        return $this->unifiedResponse(true, 'Prediction updated successfully', [
            'prediction'       => $prediction,
            'original_values'  => $originalValues,
            'raw_results'      => $results,
            'labeled_results'  => $labeledResults,
        ]);
    }

    /**
     * Delete prediction
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

        $prediction->delete();

        return $this->unifiedResponse(true, 'Prediction deleted successfully');
    }

    /**
     * Return available periods and values (for UI preview)
     */
    public function getAvailablePeriods(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'scope_type'  => 'required|in:college,university',
            'scope_id'    => 'required_if:scope_type,college|nullable|exists:colleges,id',
            'metric'      => 'required|in:revenue,expenses,profit,students',
            'period_type' => 'required|in:yearly,monthly',
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

        $series = $this->buildSeries(
            $data['scope_type'],
            $data['scope_type'] === 'college' ? $data['scope_id'] : null,
            $data['metric'],
            $data['period_type']
        );

        $periods = $series['periods'];
        $values  = $series['values'];

        $result = [];

        foreach ($periods as $i => $date) {
            $value = $values[$i] ?? null;

            if ($data['period_type'] === 'yearly') {
                $label = $date->format('Y');
            } else {
                $label = $date->format('Y-m');
            }

            $result[] = [
                'label' => $label,
                'date'  => $date->toDateString(),
                'value' => $value,
            ];
        }

        return $this->unifiedResponse(true, 'Available periods retrieved', [
            'scope_type'  => $data['scope_type'],
            'scope_id'    => $data['scope_type'] === 'college' ? $data['scope_id'] : null,
            'metric'      => $data['metric'],
            'period_type' => $data['period_type'],
            'periods'     => $result,
        ]);
    }

    /**
     * Build time series (periods + values) from stats
     *
     * @return array{periods: Carbon[], values: float[]}
     */
    protected function buildSeries(string $scopeType, ?int $scopeId, string $metric, string $periodType): array
    {
        $periods = [];
        $values  = [];

        if ($scopeType === 'college') {
            if ($periodType === 'yearly') {
                $stats = CollegeYearStat::where('college_id', $scopeId)
                    ->orderBy('year')
                    ->get();

                foreach ($stats as $row) {
                    $periods[] = Carbon::create($row->year, 1, 1);
                    if ($metric === 'revenue') {
                        $values[] = (float)($row->annual_revenue ?? 0);
                    } elseif ($metric === 'students') {
                        $values[] = (float)($row->annual_students ?? 0);
                    }
                }
            } else { // monthly – college level
                // sum expenses per (year, month)
                $expenses = CollegeMonthExpense::where('college_id', $scopeId)
                    ->selectRaw('year, month, SUM(expenses) as total_expenses')
                    ->groupBy('college_id', 'year', 'month')
                    ->orderBy('year')
                    ->orderBy('month')
                    ->get();

                $yearStats = CollegeYearStat::where('college_id', $scopeId)->get()
                    ->groupBy('year');

                foreach ($expenses as $row) {
                    $periods[] = Carbon::create($row->year, $row->month, 1);

                    if ($metric === 'expenses') {
                        $values[] = (float)$row->total_expenses;
                    } elseif ($metric === 'profit') {
                        $yearRow = optional($yearStats->get($row->year))->first();
                        $annualRevenue = $yearRow ? (float)($yearRow->annual_revenue ?? 0) : 0;
                        $monthlyRevenue = $annualRevenue / 12.0;
                        $profit = $monthlyRevenue - (float)$row->total_expenses;
                        $values[] = $profit;
                    }
                }
            }
        } else { // university scope (aggregate all colleges)
            if ($periodType === 'yearly') {
                $stats = CollegeYearStat::selectRaw(
                        'year, SUM(annual_revenue) as total_revenue, SUM(annual_students) as total_students'
                    )
                    ->groupBy('year')
                    ->orderBy('year')
                    ->get();

                foreach ($stats as $row) {
                    $periods[] = Carbon::create($row->year, 1, 1);
                    if ($metric === 'revenue') {
                        $values[] = (float)($row->total_revenue ?? 0);
                    } elseif ($metric === 'students') {
                        $values[] = (float)($row->total_students ?? 0);
                    }
                }
            } else { // monthly – university level (aggregate)
                $expenses = CollegeMonthExpense::orderBy('year')
                    ->orderBy('month')
                    ->get();

                $yearStats = CollegeYearStat::all()
                    ->groupBy('college_id')
                    ->map(function ($rows) {
                        return $rows->keyBy('year');
                    });

                $grouped = $expenses->groupBy(function ($row) {
                    return $row->year . '-' . str_pad($row->month, 2, '0', STR_PAD_LEFT);
                });

                foreach ($grouped as $key => $rows) {
                    [$year, $month] = explode('-', $key);
                    $year = (int)$year;
                    $month = (int)$month;

                    $periods[] = Carbon::create($year, $month, 1);

                    if ($metric === 'expenses') {
                        $sum = $rows->sum('expenses');
                        $values[] = (float)$sum;
                    } elseif ($metric === 'profit') {
                        $totalExpenses = 0.0;
                        $totalMonthlyRevenue = 0.0;

                        foreach ($rows as $row) {
                            $totalExpenses += (float)$row->expenses;

                            $statsForCollege = $yearStats->get($row->college_id);
                            if ($statsForCollege && $statsForCollege->has($year)) {
                                $annualRevenue = (float)($statsForCollege->get($year)->annual_revenue ?? 0);
                                $totalMonthlyRevenue += $annualRevenue / 12.0;
                            }
                        }

                        $values[] = $totalMonthlyRevenue - $totalExpenses;
                    }
                }
            }
        }

        return [
            'periods' => $periods,
            'values'  => $values,
        ];
    }

    /**
     * Store original series
     */
    protected function storeOriginalValuesFromSeries(int $predictionId, array $values, array $periods): void
    {
        foreach ($values as $i => $val) {
            /** @var Carbon $date */
            $date = $periods[$i];

            PredictionValue::create([
                'prediction_id' => $predictionId,
                'index'         => $i + 1,
                'value'         => $val,
                'period_date'   => $date->toDateString(),
            ]);
        }
    }

    /**
     * Store future results
     */
    protected function storePredictedResults(
        int $predictionId,
        array $predictedValues,
        string $periodType,
        Carbon $lastPeriod,
        int $existingCount
    ): array {
        $results = [];

        foreach ($predictedValues as $i => $value) {
            $step = $i + 1;

            $futureDate = $this->getFutureDate($periodType, $lastPeriod, $step);

            $result = PredictionResult::create([
                'prediction_id'   => $predictionId,
                'index'           => $existingCount + $step,
                'predicted_value' => $value,
                'period_date'     => $futureDate->toDateString(),
            ]);

            $results[] = $result;
        }

        return $results;
    }

    /**
     * Build labels for predicted values
     */
    protected function attachTimeLabels(
        array $predictedValues,
        string $periodType,
        Carbon $lastPeriod
    ): array {
        $labels = [];

        foreach ($predictedValues as $i => $value) {
            $step = $i + 1;
            $date = $this->getFutureDate($periodType, $lastPeriod, $step);

            if ($periodType === 'yearly') {
                $label = $date->format('Y');
            } else {
                $label = $date->format('Y-m');
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
     * Compute future date according to period type
     */
    protected function getFutureDate(string $periodType, Carbon $lastPeriod, int $step): Carbon
    {
        if ($periodType === 'yearly') {
            return $lastPeriod->copy()->addYears($step);
        }

        return $lastPeriod->copy()->addMonths($step);
    }

    /**
     * Multi-step prediction with moving window
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
     * Detect trend vs fluctuation
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
     * Next value using average
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

    /**
     * Apply logical bounds (min/max) to a predicted value
     * based on metric and scope.
     *
     * - students: [0, max_students_capacity]
     * - revenue:  [0, max_annual_revenue]
     * - expenses: [0, +inf)
     * - profit:   no hard bounds (can be negative)
     */
    protected function applyBounds(
        string $metric,
        string $scopeType,
        ?int $scopeId,
        float $value
    ): float {
        $min = null;
        $max = null;

        // Base minimums
        if (in_array($metric, ['students', 'revenue', 'expenses'])) {
            $min = 0.0;
        }

        // College-specific caps
        if ($scopeType === 'college' && $scopeId) {
            $college = College::find($scopeId);

            if ($college) {
                if ($metric === 'students' && !is_null($college->max_students_capacity)) {
                    $max = (float) $college->max_students_capacity;
                }

                if ($metric === 'revenue' && !is_null($college->max_annual_revenue)) {
                    $max = (float) $college->max_annual_revenue;
                }
            }
        }

        // Apply min/max if defined
        $bounded = $value;

        if (!is_null($min)) {
            $bounded = max($bounded, $min);
        }

        if (!is_null($max)) {
            $bounded = min($bounded, $max);
        }

        return $bounded;
    }
}
