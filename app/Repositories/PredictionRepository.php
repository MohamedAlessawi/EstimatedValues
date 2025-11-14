<?php
namespace App\Repositories;

use App\Models\Prediction;

class PredictionRepository
{
    public function create(array $data)
    {
        return Prediction::create($data);
    }

    public function getUserPredictions($userId)
    {
        return Prediction::where('user_id', $userId)
            ->with(['values', 'results'])
            ->latest()
            ->get();
    }
}
