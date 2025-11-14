<?php
namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Services\Auth\TwoFactorService;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class TwoFactorController extends Controller
{
    protected $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    // Enables 2FA for the authenticated user
    public function enable(Request $request)
    {
        $user = Auth::user();
        $secret = $this->twoFactorService->enableTwoFactorAuth($user);
        return response()->json(['message' => '2FA enabled successfully.', 'secret' => $secret]);
    }

    // Disables 2FA for the authenticated user
    public function disable(Request $request)
    {
        $user = Auth::user();
        $this->twoFactorService->disableTwoFactorAuth($user);
        return response()->json(['message' => '2FA disabled successfully.']);
    }


    public function verify(Request $request)
    {
        \Log::info('Received 2FA verification request', $request->all());

        try {
            $result = $this->twoFactorService->verify2FA($request);

            \Log::info('Controller Response:', $result);

            if (isset($result['status']) && $result['status'] === 401) {
                \Log::error('2FA verification failed for user: ' . $request->user_id);
                return response()->json(['message' => $result['message']], 401);
            }

            \Log::info('2FA verification successful for user: ' . $request->user_id);
            return response()->json(['message' => $result['message'], 'token' => $result['token']], 200);
        } catch (\Exception $e) {
            \Log::error('Error during 2FA verification: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during 2FA verification.'], 500);
        }
    }

}

