<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\UserVerify;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

use Exception;

class EmailVerificationService
{
    public function verifyEmail($request)
    {
        try {
            // $cachedData = Cache::get("verification_code_{$request->ip()}");

            $cachedData = Cache::get($request->ip());
            $email = $cachedData[1] ?? null;
            $code = $cachedData[0] ?? null;
            if (!$cachedData) {
                return [
                    'message' => 'Your Verification code was expired.',
                    'status' => 422
                ];
            }



            if ($code === $request->token) {
                $user = User::whereEmail($email)->first();

                if ($user) {
                    $user->email_verified_at = now();
                    $user->save();

                    return [
                        'message' => 'Email verified successfully.',
                        'status' => 200
                    ];
                }

                return [
                    'message' => 'User not found.',
                    'status' => 404
                    ];
            }

            return [
                'message' => 'Invalid or expired token.',
                'status' => 422
            ];

        } catch (Exception $e) {
            Log::error('Email verification error: ' . $e->getMessage());
            return [
                'message' => 'Email verification failed. Please try again later.',
                'status' => 500
            ];
        }
    }

    public function resendVerificationCode($request)
    {
        try {
            $ip = $request->ip();
            $attempts = Cache::get("resend_attempts_{$ip}", 0);
            // Log::info("your cache data",$attempts);
            Log::info("Resend attempts for IP {$ip}: {$attempts}");

            if ($attempts >= 2) {
                return [
                    'message' => 'Too many attempts. Please try again later.',
                    'status' => 429
                ];
            }

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return [
                    'message' => 'User not found.',
                    'status' => 404
                ];
            }

            $code = Str::random(6);

            UserVerify::updateOrCreate(
                ['user_id' => $user->id],
                ['token' => $code]
            );

            Mail::send('emails.verifyEmail', ['token' => $code], function($message) use ($request) {
                $message->to($request->email);
                $message->subject('Email Verification Code');
            });

            Cache::put($ip, [$code, $request->email], now()->addMinutes(10));
            Cache::put("resend_attempts_{$ip}", $attempts + 1, now()->addMinutes(10));

            Log::info("Verification code for IP {$ip}: {$code}");
            return [
                'message' => 'Verification code resent successfully.',
                'status' => 200
            ];

        } catch (Exception $e) {
            Log::error('Resend verification code error: ' . $e->getMessage());
            return [
                'message' => 'Failed to resend verification code. Please try again later.',
                'status' => 500
            ];
        }
    }
}
