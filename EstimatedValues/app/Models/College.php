<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class College extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'max_students_capacity',
        'max_annual_revenue',
    ];

    protected $casts = [
        'max_students_capacity' => 'integer', 
        'max_annual_revenue'    => 'float',
    ];

    public function yearStats()
    {
        return $this->hasMany(CollegeYearStat::class);
    }

    public function monthExpenses()
    {
        return $this->hasMany(CollegeMonthExpense::class);
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'scope_id');
    }
}
