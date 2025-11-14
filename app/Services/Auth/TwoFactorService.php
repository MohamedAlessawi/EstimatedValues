<?php
namespace App\Services\Auth;

use ParagonIE\ConstantTime\Base32;
use OTPHP\TOTP;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;


class TwoFactorService
{

    // Generates a secret key for 2FA
    public function generateSecretKey()
    {
        return random_int(100000, 999999);
    }

    // Verifies the provided one-time password against the secret key
    public function verifyKey($user, $oneTimePassword)
    {
        // $otp = TOTP::create($user->two_factor_secret);
        // \Log::info('Generated OTP: ' . $otp->now()); // Log the generated OTP
        // $result = $otp->verify($oneTimePassword);
        // \Log::info('OTP Verification Result: ' . ($result ? 'Success' : 'Failure')); // Log the verification result
        // return $result;
        // // return $otp->verify($oneTimePassword);
        try {
            $otp = TOTP::create($user->two_factor_secret);
            \Log::info('Generated OTP: ' . $otp->now()); // Log the generated OTP
            $result = $otp->verify($oneTimePassword);
            \Log::info('OTP Verification Result: ' . ($result ? 'Success' : 'Failure')); // Log the verification result
            return $result;
        } catch (\Exception $e) {
            \Log::error('Error during OTP verification: ' . $e->getMessage());
            return false;
        }
    }

    // Enables 2FA for the user
    public function enableTwoFactorAuth($user)
    {

        $secret = $this->generateSecretKey();
        $user->two_factor_secret = $secret;
        $user->two_factor_enabled = true;
        $user->save();
        \Log::info('2FA Secret Key Generated: ' . $secret); // Log the secret key
        $email = $user->email;
        Mail::send('emails.2FA', ['secret' => $secret], function($message) use ($email) {
                    $message->to($email);
                    $message->subject('Two-Factor Authentication Code');
                });
        return $secret;
    }

    // Disables 2FA for the user
    public function disableTwoFactorAuth($user)
    {
        $user->two_factor_secret = null;
        $user->two_factor_enabled = false;
        $user->save();
    }

    // Verifies the 2FA code and generates a token if successful
    public function verify2FA($request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'one_time_password' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user = User::find($request->user_id);
        if (!$user) {
            return[
                'message' => 'User not found.',
                'status'=>404
            ];
        }

        $valid = $this->verifyKey($user, $request->one_time_password);
        if ($valid) {
            $token = $user->createToken('authToken')->plainTextToken;
            return [
                'message' => '2FA verification successful.',
                'token' => $token,
                'status'=>200
            ];
        }

        return [
            'message' => 'Invalid 2FA code.',
            'status'=>401];
    }

}
















