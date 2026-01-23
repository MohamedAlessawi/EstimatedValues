<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PredictionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'prediction_id',
        'index',
        'value',
        'period_date',
    ];

    protected $casts = [
        'value'       => 'float',
        'period_date' => 'date',
    ];

    public function prediction() {
        return $this->belongsTo(Prediction::class);
    }
}
