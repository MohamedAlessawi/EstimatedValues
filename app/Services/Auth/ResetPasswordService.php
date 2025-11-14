<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\PasswordResetCode;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;


class ResetPasswordService
{
    public function resetPassword($email, $code, $password)
    {
        // Verify the code
        $resetCode = PasswordResetCode::where('email', $email)
            ->where('code', $code)
            ->first();

        
        if (!$resetCode || Carbon::parse($resetCode->created_at)->addMinutes(60)->isPast())
            return ['message' => 'Invalid or expired reset code.', 'status' => 422];

        // Reset the password
        $user = User::where('email', $email)->first();
        $user->password = Hash::make($password);
        $user->save();

        // Delete the reset code
        $resetCode->delete();

        return ['message' => 'Password has been reset.', 'status' => 200];
    }
}
