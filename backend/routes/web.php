<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DataDeletionController;
use App\Http\Controllers\LandingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing');

Route::view('/terms', 'legal.terms')->name('terms');
Route::view('/privacy', 'legal.privacy')->name('privacy');
Route::get('/data-deletion', [DataDeletionController::class, 'show'])->name('data-deletion.show');
Route::post('/data-deletion', [DataDeletionController::class, 'submit'])
    ->middleware('throttle:10,1')
    ->name('data-deletion.submit');

Route::get('/contact', [ContactController::class, 'show'])->name('contact.show');
Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:contact')
    ->name('contact.submit');

    Route::prefix('admin')->group(function () {
    Route::get('login', [AuthController::class, 'show'])->name('admin.login');
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:admin-login')
        ->name('admin.login.submit');
    Route::post('logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::middleware('admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('users', [DashboardController::class, 'users'])->name('admin.users');
        Route::get('users/{user}', [DashboardController::class, 'showUser'])
            ->whereNumber('user')
            ->name('admin.users.show');
        Route::post('users/{user}/toggle', [DashboardController::class, 'toggleUser'])->name('admin.users.toggle');
        Route::post('users/{user}/moderator', [DashboardController::class, 'toggleModerator'])->name('admin.users.moderator');
        Route::post('users/{user}/notes', [DashboardController::class, 'addUserNote'])->name('admin.users.note');
        Route::post('users/bulk', [DashboardController::class, 'bulkUsers'])->name('admin.users.bulk');
        Route::get('reports', [DashboardController::class, 'reports'])->name('admin.reports');
        Route::get('audit', [DashboardController::class, 'audit'])->name('admin.audit');
        Route::delete('memories/{memory}', [DashboardController::class, 'deleteMemory'])->name('admin.memories.delete');
        Route::delete('comments/{comment}', [DashboardController::class, 'deleteComment'])->name('admin.comments.delete');
        Route::delete('messages/{message}', [DashboardController::class, 'deleteMessage'])->name('admin.messages.delete');
        Route::post('reports/{report}/dismiss', [DashboardController::class, 'dismissReport'])->name('admin.reports.dismiss');
        Route::post('reports/{report}/remove', [DashboardController::class, 'removeReportTarget'])->name('admin.reports.remove');
    });
});
