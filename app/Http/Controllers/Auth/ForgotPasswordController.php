<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\Auth\ForgotPasswordService;
use App\Services\Auth\ResetPasswordService;
use Illuminate\Support\Facades\Validator;


class ForgotPasswordController extends Controller
{
    protected $forgotPasswordService;
    protected $resetPasswordService;


    public function __construct(ForgotPasswordService $forgotPasswordService, ResetPasswordService $resetPasswordService)
    {
        $this->forgotPasswordService = $forgotPasswordService;
        $this->resetPasswordService = $resetPasswordService;

    }

    public function sendResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $response = $this->forgotPasswordService->sendResetCode($request->email);

        return response()->json($response, 200);
    }



    public function reset(ResetPasswordRequest $request)
    {
        $response = $this->resetPasswordService->resetPassword(
            $request->email,
            $request->code,
            $request->password
        );

        return response()->json(['message' => $response['message']], $response['status']);
    }

}
