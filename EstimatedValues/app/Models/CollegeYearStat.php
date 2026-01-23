<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollegeYearStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'college_id',
        'year',
        'annual_revenue',
        'annual_students',
    ];

    protected $casts = [
        'year'            => 'integer',
        'annual_revenue'  => 'float',
        'annual_students' => 'integer',
    ];

    public function college()
    {
        return $this->belongsTo(College::class);
    }
}
