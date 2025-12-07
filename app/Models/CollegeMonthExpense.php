<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollegeMonthExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'college_id',
        'year',
        'month',
        'expenses',
        'description',
    ];

    protected $casts = [
        'year'     => 'integer',
        'month'    => 'integer',
        'expenses' => 'float',
    ];

    public function college()
    {
        return $this->belongsTo(College::class);
    }
}
