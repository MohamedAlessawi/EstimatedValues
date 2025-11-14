<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginLogoutService;
use Illuminate\Http\Request;
use App\Traits\FileUploadTrait;


class LoginController extends Controller
{
    use FileUploadTrait;

    protected $loginLogoutService;

    public function __construct(LoginLogoutService $loginLogoutService)
    {
        $this->loginLogoutService = $loginLogoutService;
    }

    public function login(Request $request)
    {
        $result = $this->loginLogoutService->login($request);

        return $this->jsonResponse(
            ['message' => $result['message'],
            'data' => $result['data'] ?? null],
            $result['status']
        );
    }

    public function logout(Request $request)
    {
        $result = $this->loginLogoutService->logout($request);
        return $this->jsonResponse(
            ['message' => $result['message']],
            $result['status']
        );
    }


    public function refresh(Request $request)
    {
        $result = $this->loginLogoutService->refresh($request);

        return $this->jsonResponse(
            ['message' => $result['message'],
            'data' => $result['data'] ?? null],
            $result['status']
        );

    }
}


