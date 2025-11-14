<?php
namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Exception;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Services\Auth\TwoFactorService;


class LoginLogoutService
{
    protected $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    public function login($request)
    {
        $validated = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['login'])
                    ->orWhere('phone', $validated['login'])
                    ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            \Log::error('Invalid credentials for user: ' . $validated['login']);
            return [
                'message' => 'Invalid credentials.',
                'status' => 401
            ];
        }

        // if (!$user->email_verified_at) {
        //     \Log::error('Email not verified for user: ' . $user->id);

        //     return [

        //         'message' => 'Email not verified.',
        //         'status' => 403
        //     ];
        // }
        // Check if 2FA is enabled for the user
        if ($user->two_factor_enabled) {


            // Return a response indicating 2FA is required
            return [
                'message' => '2FA required.',
                'data'=>[
                    'user_id' => $user->id
                ],
                'status' => 200,
            ];
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = Str::random(60);
        $user->refresh_token = $refreshToken;
        $user->refresh_token_expires_at = Carbon::now()->addMinutes(20);
        $user->save();

        return [
            'message' => 'Login successful',
            'data' => [
                'access_token' => $token,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer'
            ],
            'status' => 200
        ];
    }


    public function logout($request)
    {
        $request->user()->currentAccessToken()->delete();

        return [
            'message' => 'Logged out successfully.',
            'status' => 200
        ];
    }



    public function refresh($request)
    {
        $validated = $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $user = User::where('refresh_token', $validated['refresh_token'])
                    ->where('refresh_token_expires_at', '>', Carbon::now())
                    ->first();

        if (!$user) {
            return [
                'message' => 'Invalid or expired refresh token.',
                'status' => 401
            ];
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = Str::random(60);
        $user->refresh_token = $refreshToken;
        $user->refresh_token_expires_at = Carbon::now()->addMinutes(20);
        $user->save();

        return [
            'message' => 'New refresh token successfully',
            'data' =>[
                'access_token' => $token,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer'
            ],
            'status' => 200
        ];
    }


}
