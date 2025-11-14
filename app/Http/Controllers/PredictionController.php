<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PredictionValue;
use App\Models\PredictionResult;
use App\Repositories\PredictionRepository;
use App\Services\PredictionService;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;

class PredictionController extends Controller
{
    use ApiResponseTrait;

    protected $service;
    protected $repo;

    public function __construct(PredictionService $service, PredictionRepository $repo)
    {
        $this->service = $service;
        $this->repo = $repo;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'prediction_type' => 'nullable|string',
            'values' => 'required|array|min:2',
            'values.*' => 'numeric',
            'future_steps' => 'integer|min:1|max:12'
        ]);

        $prediction = $this->repo->create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'prediction_type' => $validated['prediction_type'] ?? null,
            'future_steps' => $validated['future_steps'] ?? 3,
        ]);

        foreach ($validated['values'] as $i => $v) {
            PredictionValue::create([
                'prediction_id' => $prediction->id,
                'index' => $i + 1,
                'value' => $v
            ]);
        }

        $predicted = $this->service->predict($validated['values'], $validated['future_steps']);

        foreach ($predicted as $i => $v) {
            PredictionResult::create([
                'prediction_id' => $prediction->id,
                'index' => $i + 1,
                'predicted_value' => $v
            ]);
        }

        return $this->unifiedResponse(true, 'Prediction completed successfully', [
            'prediction' => $prediction,
            'results' => $predicted
        ]);
    }

    public function history()
    {
        $predictions = $this->repo->getUserPredictions(auth()->id());
        return $this->unifiedResponse(true, 'Prediction history retrieved', $predictions);
    }
}
