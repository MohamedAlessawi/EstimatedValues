<?php
namespace App\Services\Auth;

use App\Models\PasswordResetCode;
use Illuminate\Support\Facades\Mail;

use Illuminate\Support\Str;

class ForgotPasswordService
{
    public function sendResetCode($email)
    {
        // Generate a random code
        $code = mt_rand(100000, 999999);


        // Store the code in the database
        PasswordResetCode::updateOrCreate(
            ['email' => $email],
            ['code' => $code, 'created_at' => now()]
        );

        // Send the code via email
        Mail::send('emails.reset_code', ['code' => $code], function($message) use ($email) {
            $message->to($email);
            $message->subject('Password Reset Code');
        });

        return ['message' => 'Reset code sent to your email.'];
    }
}
