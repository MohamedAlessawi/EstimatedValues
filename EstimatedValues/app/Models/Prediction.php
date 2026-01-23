<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'scope_type',   // 'college' | 'university'
        'scope_id',     // college_id or null
        'title',
        'description',
        'metric',       // 'revenue' | 'expenses' | 'profit' | 'students'
        'period_type',  // 'yearly' | 'monthly'
        'future_steps',
        'start_date',
    ];

    protected $casts = [
        'future_steps' => 'integer',
        'start_date'   => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function college()
    {
        return $this->belongsTo(College::class, 'scope_id');
    }

    public function values()
    {
        return $this->hasMany(PredictionValue::class);
    }

    public function results()
    {
        return $this->hasMany(PredictionResult::class);
    }
}
