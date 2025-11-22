<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\PredictionService;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    protected $service;

    public function __construct(PredictionService $service)
    {
        $this->service = $service;
    }

    public function store(Request $request)
    {
        return $this->service->createPrediction($request);
    }

    public function history(Request $request)
    {
        return $this->service->history($request->user()->id);
    }

    public function show(Request $request, int $id)
    {
        return $this->service->showPrediction($request, $id);
    }

    public function update(Request $request, int $id)
    {
        return $this->service->updatePrediction($request, $id);
    }

    public function destroy(Request $request, int $id)
    {
        return $this->service->deletePrediction($request, $id);
    }
}
