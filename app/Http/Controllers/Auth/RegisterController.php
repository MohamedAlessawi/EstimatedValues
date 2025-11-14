<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Services\Auth\RegisterService;
use App\Services\Auth\EmailVerificationService;
use Illuminate\Http\Request;
use App\Traits\FileUploadTrait;

class RegisterController extends Controller
{
    use FileUploadTrait;

    protected $registerService;
    protected $emailVerificationService;


    public function __construct(RegisterService $registerService, EmailVerificationService $emailVerificationService)
    {
        $this->registerService = $registerService;
        $this->emailVerificationService = $emailVerificationService;
    }


    public function register(RegisterRequest $request)
    {
        $result = $this->registerService->register($request);

        return $this->jsonResponse(['message' => $result['message']], $result['status']);
    }


    public function verifyEmail(Request $request)
    {
        $result = $this->emailVerificationService->verifyEmail($request);

        return $this->jsonResponse(['message' => $result['message']], $result['status']);
    }


    public function resendVerificationCode(Request $request)
    {
        $result = $this->emailVerificationService->resendVerificationCode($request);

        return response()->json(['message' => $result['message']], $result['status']);
    }
}

