<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\UserVerify;
use App\Traits\FileUploadTrait;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class RegisterService
{
    use FileUploadTrait;

    public function register($request)
    {
        try
        {
            $profilePhotoPath = $this->handleFileUpload($request, 'profile_photo', 'profile_photos');

            $user = User::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'profile_photo' => $profilePhotoPath,
                'ip_address' => $request->ip(),
            ]);

            $code = Str::random(6);

            UserVerify::create([
                'user_id' => $user->id,
                'token' => $code,
            ]);

            Cache::put($request->ip(), [$code, $request->email], now()->addMinutes(3));

            // Mail::send('emails.verifyEmail', ['token' => $code], function($message) use ($request) {
            //     $message->to($request->email);
            //     $message->subject('Email Verification Code');
            // });

            return [
                'message' => 'Registration successful, please check your email for verification code.',
                'status' => 201
            ];

        } catch (Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return [
                'message' => 'Registration failed. Please try again later.',
                'status' => 500
            ];
        }
    }
}
