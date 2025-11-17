<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'prediction_type',
        'future_steps',
        'start_date',
    ];

    protected $casts = [
        'future_steps' => 'integer',
        'start_date'   => 'date',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function values() {
        return $this->hasMany(PredictionValue::class);
    }

    public function results() {
        return $this->hasMany(PredictionResult::class);
    }
}
