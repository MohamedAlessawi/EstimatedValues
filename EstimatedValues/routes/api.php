<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\UserController;

use App\Http\Controllers\CollegeController;





/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Auth routes
route::post('register',[RegisterController::class, 'register']);
Route::post('verify-email', [RegisterController::class, 'verifyEmail']);
Route::middleware('throttle:2,10')->post('resend-verification-code',[RegisterController::class,'resendVerificationCode'])
    ->name('resend.verification.code');;
Route::post('login', [LoginController::class, 'login'])
    ->name('login');
Route::post('refresh-token',[LoginController::class, 'refresh']);
Route::post('logout', [LoginController::class, 'logout'])->middleware('auth:sanctum');


Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetCode']);
Route::post('reset-password', [ForgotPasswordController::class, 'reset']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('2fa/enable', [TwoFactorController::class, 'enable']);
    Route::post('2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('2fa/verify', [TwoFactorController::class, 'verify']);
});
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware('auth:sanctum')->group(function() {
    /* Colleges CRUD */
    Route::post('/colleges', [CollegeController::class, 'store']);
    Route::get('/colleges', [CollegeController::class, 'indexColleges']);
    Route::get('/colleges/{id}', [CollegeController::class, 'showCollege']);
    Route::put('/colleges/{id}', [CollegeController::class, 'updateCollege']);
    Route::delete('/colleges/{id}', [CollegeController::class, 'deleteCollege']);

    /* Year stats (revenues/students) */
    Route::post('/colleges/{college}/year-stats', [CollegeController::class, 'storeYearStat']);
    Route::get('/year-stats', [CollegeController::class, 'indexYearStats']); // global list with filters
    Route::get('/year-stats/{id}', [CollegeController::class, 'showYearStat']);
    Route::put('/year-stats/{id}', [CollegeController::class, 'updateYearStat']);
    Route::delete('/year-stats/{id}', [CollegeController::class, 'deleteYearStat']);

    /* Month expenses */
    Route::post('/colleges/{college}/month-expenses', [CollegeController::class, 'storeMonthExpense']);
    Route::get('/month-expenses', [CollegeController::class, 'indexMonthExpenses']); // global list with filters
    Route::get('/month-expenses/{id}', [CollegeController::class, 'showMonthExpense']);
    Route::put('/month-expenses/{id}', [CollegeController::class, 'updateMonthExpense']);
    Route::delete('/month-expenses/{id}', [CollegeController::class, 'deleteMonthExpense']);

    // Predictions
    Route::post('/predict', [PredictionController::class, 'store']);
    Route::get('/predict/history', [PredictionController::class, 'history']);
    Route::get('/predict/history/{id}', [PredictionController::class, 'show']);
    Route::put('/predict/history/{id}', [PredictionController::class, 'update']);
    Route::delete('/predict/history/{id}', [PredictionController::class, 'destroy']);

    // Available periods for given config
    Route::get('/predict/periods', [PredictionController::class, 'availablePeriods']);


    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::post('/user/photo', [UserController::class, 'updatePhoto']);
    Route::delete('/user/photo', [UserController::class, 'deletePhoto']);
});
