<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\CollegeYearStat;
use App\Models\CollegeMonthExpense;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CollegeController extends Controller
{
    use ApiResponseTrait;

    /* =========================
     * Colleges CRUD
     * ========================= */

    // Create college
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'max_students_capacity' => 'nullable|integer|min:1',
            'max_annual_revenue'    => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $college = College::create($validator->validated());

        return $this->unifiedResponse(true, 'College created successfully', $college);
    }

    // List colleges
    public function indexColleges(Request $request)
    {
        $colleges = College::orderBy('name')->get();

        return $this->unifiedResponse(true, 'Colleges list retrieved', $colleges);
    }

    // Show single college
    public function showCollege(int $id)
    {
        $college = College::find($id);

        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        return $this->unifiedResponse(true, 'College retrieved successfully', $college);
    }

    // Update college
    public function updateCollege(Request $request, int $id)
    {
        $college = College::find($id);

        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'max_students_capacity' => 'sometimes|nullable|integer|min:1',
            'max_annual_revenue'    => 'sometimes|nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $college->update($validator->validated());

        return $this->unifiedResponse(true, 'College updated successfully', $college);
    }

    // Delete college
    public function deleteCollege(int $id)
    {
        $college = College::find($id);

        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        $college->delete();

        return $this->unifiedResponse(true, 'College deleted successfully');
    }

    /* =========================
     * Year Stats (revenue/students) CRUD
     * ========================= */

    // Create or update yearly stats for a college (with max constraints + no future year)
    public function storeYearStat(Request $request, int $collegeId)
    {
        //  Ensure college exists
        $college = College::find($collegeId);
        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        $currentYear = now()->year; // ✅ NEW

        $validator = Validator::make($request->all(), [
            'year' => 'required|integer|min:1900|max:' . $currentYear,

            'annual_revenue' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($college) {
                    if (!is_null($value) && !is_null($college->max_annual_revenue) && $value > $college->max_annual_revenue) {
                        $fail("Annual revenue cannot exceed the college max annual revenue ({$college->max_annual_revenue}).");
                    }
                }
            ],

            // students must not exceed max_students_capacity (if set)
            'annual_students' => [
                'nullable',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) use ($college) {
                    if (!is_null($value) && !is_null($college->max_students_capacity) && $value > $college->max_students_capacity) {
                        $fail("Annual students cannot exceed the college max students capacity ({$college->max_students_capacity}).");
                    }
                }
            ],
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['college_id'] = $collegeId;

        $stat = CollegeYearStat::updateOrCreate(
            ['college_id' => $collegeId, 'year' => $data['year']],
            $data
        );

        return $this->unifiedResponse(true, 'Year stats saved successfully', $stat);
    }

    // List all year stats (with filters)
    public function indexYearStats(Request $request)
    {
        $query = CollegeYearStat::with('college')
            ->orderBy('year', 'desc');

        if ($request->filled('college_id')) {
            $query->where('college_id', $request->college_id);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        $stats = $query->get();

        return $this->unifiedResponse(true, 'Year stats list retrieved', $stats);
    }

    // Show single year stat by id
    public function showYearStat(int $id)
    {
        $stat = CollegeYearStat::with('college')->find($id);

        if (!$stat) {
            return $this->unifiedResponse(false, 'Year stat not found', [], [], 404);
        }

        return $this->unifiedResponse(true, 'Year stat retrieved successfully', $stat);
    }

    // Update single year stat (with max constraints + no future year)
    public function updateYearStat(Request $request, int $id)
    {
        $stat = CollegeYearStat::find($id);

        if (!$stat) {
            return $this->unifiedResponse(false, 'Year stat not found', [], [], 404);
        }

        // load related college for constraints
        $college = College::find($stat->college_id);
        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        $currentYear = now()->year;

        $validator = Validator::make($request->all(), [
            'year' => 'sometimes|integer|min:1900|max:' . $currentYear,

            //  revenue cap
            'annual_revenue' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($college) {
                    if (!is_null($value) && !is_null($college->max_annual_revenue) && $value > $college->max_annual_revenue) {
                        $fail("Annual revenue cannot exceed the college max annual revenue ({$college->max_annual_revenue}).");
                    }
                }
            ],

            // students cap
            'annual_students' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) use ($college) {
                    if (!is_null($value) && !is_null($college->max_students_capacity) && $value > $college->max_students_capacity) {
                        $fail("Annual students cannot exceed the college max students capacity ({$college->max_students_capacity}).");
                    }
                }
            ],
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $stat->update($validator->validated());

        return $this->unifiedResponse(true, 'Year stat updated successfully', $stat);
    }

    // Delete single year stat
    public function deleteYearStat(int $id)
    {
        $stat = CollegeYearStat::find($id);

        if (!$stat) {
            return $this->unifiedResponse(false, 'Year stat not found', [], [], 404);
        }

        $stat->delete();

        return $this->unifiedResponse(true, 'Year stat deleted successfully');
    }

    /* =========================
     * Month Expenses CRUD
     * ========================= */

    //  Create new monthly expense (no future month/year allowed)
    public function storeMonthExpense(Request $request, int $collegeId)
    {
        // Ensure college exists
        $college = College::find($collegeId);
        if (!$college) {
            return $this->unifiedResponse(false, 'College not found', [], [], 404);
        }

        $currentYear = now()->year;
        $currentMonth = now()->month;

        $validator = Validator::make($request->all(), [
            'year'  => 'required|integer|min:1900|max:' . $currentYear,

            'month' => 'required|integer|min:1|max:12',

            'expenses' => 'required|numeric|min:0',

            'description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $data = $validator->validated();

        //  prevent future month within current year
        if ((int)$data['year'] === $currentYear && (int)$data['month'] > $currentMonth) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                ['month' => ['Month cannot be in the future for the current year.']],
                422
            );
        }

        $data['college_id'] = $collegeId;

        $expense = CollegeMonthExpense::create($data);

        return $this->unifiedResponse(true, 'Monthly expense saved successfully', $expense);
    }

    // List all month expenses (with filters)
    public function indexMonthExpenses(Request $request)
    {
        $query = CollegeMonthExpense::with('college')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($request->filled('college_id')) {
            $query->where('college_id', $request->college_id);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        $expenses = $query->get();

        return $this->unifiedResponse(true, 'Month expenses list retrieved', $expenses);
    }

    // Show single month expense
    public function showMonthExpense(int $id)
    {
        $expense = CollegeMonthExpense::with('college')->find($id);

        if (!$expense) {
            return $this->unifiedResponse(false, 'Month expense not found', [], [], 404);
        }

        return $this->unifiedResponse(true, 'Month expense retrieved successfully', $expense);
    }

    // Update single month expense (prevent future month/year)
    public function updateMonthExpense(Request $request, int $id)
    {
        $expense = CollegeMonthExpense::find($id);

        if (!$expense) {
            return $this->unifiedResponse(false, 'Month expense not found', [], [], 404);
        }

        $currentYear = now()->year;
        $currentMonth = now()->month;

        $validator = Validator::make($request->all(), [
            //  prevent future year
            'year'  => 'sometimes|integer|min:1900|max:' . $currentYear,

            'month' => 'sometimes|integer|min:1|max:12',

            // prevent negative expenses
            'expenses' => 'sometimes|numeric|min:0',

            'description' => 'sometimes|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation error', [], $validator->errors(), 422);
        }

        $data = $validator->validated();

        // determine final year/month after update (support partial updates)
        $finalYear  = array_key_exists('year', $data) ? (int)$data['year'] : (int)$expense->year;
        $finalMonth = array_key_exists('month', $data) ? (int)$data['month'] : (int)$expense->month;

        //  block future month in current year
        if ($finalYear > $currentYear) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                ['year' => ['Year cannot be in the future.']],
                422
            );
        }

        if ($finalYear === $currentYear && $finalMonth > $currentMonth) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                ['month' => ['Month cannot be in the future for the current year.']],
                422
            );
        }

        $expense->update($data);

        return $this->unifiedResponse(true, 'Month expense updated successfully', $expense);
    }

    // Delete single month expense
    public function deleteMonthExpense(int $id)
    {
        $expense = CollegeMonthExpense::find($id);

        if (!$expense) {
            return $this->unifiedResponse(false, 'Month expense not found', [], [], 404);
        }

        $expense->delete();

        return $this->unifiedResponse(true, 'Month expense deleted successfully');
    }
}
