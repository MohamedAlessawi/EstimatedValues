<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $service;

    public function __construct(UserService $service)
    {
        $this->service = $service;
    }


    public function show(Request $request)
    {
        return $this->service->getProfile($request->user());
    }


    public function update(Request $request)
    {
        return $this->service->updateProfile($request);
    }


    public function updatePhoto(Request $request)
    {
        return $this->service->updatePhoto($request);
    }

 
    public function deletePhoto(Request $request)
    {
        return $this->service->deletePhoto($request);
    }
}
