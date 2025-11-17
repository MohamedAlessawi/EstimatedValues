<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PredictionResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'prediction_id',
        'index',
        'predicted_value',
        'period_date',
    ];

    protected $casts = [
        'predicted_value' => 'float',
        'period_date'     => 'date',
    ];

    public function prediction() {
        return $this->belongsTo(Prediction::class);
    }
}

