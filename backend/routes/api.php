<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\SphController;
use App\Http\Controllers\AudiensiController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\MarketingPlanController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\UserTutorialController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/validate-invite-code', [AuthController::class, 'validateInviteCode'])->middleware('throttle:10,1');
Route::post('/register-invite', [AuthController::class, 'registerWithInvite'])->middleware('throttle:5,1');

// Password Reset
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/password-reset/{token}', function (Illuminate\Http\Request $request, $token) {
    return redirect(env('FRONTEND_URL') . '?mode=reset-password&token=' . $token . '&email=' . $request->email);
})->name('password.reset');

// Email Verification
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->middleware(['auth:sanctum', 'throttle:6,1']);

// Protected routes
Route::middleware(['auth:sanctum', 'track.activity'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
    Route::get('/dashboard/top-projects', [DashboardController::class, 'topProjects']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
    
    // Projects
    Route::apiResource('projects', ProjectController::class);
    Route::get('/projects/monitoring/stats', [ProjectController::class, 'monitoringStats']);
    Route::post('/projects/{id}/approve', [ProjectController::class, 'approve'])->middleware('role:approver');
    Route::post('/projects/{id}/reject', [ProjectController::class, 'reject'])->middleware('role:approver');
    Route::get('/projects/{id}/detail', [ProjectController::class, 'detail']);
    
    // Project Attachments
    Route::post('/projects/{projectId}/attachments', [\App\Http\Controllers\ProjectAttachmentController::class, 'store']);
    Route::delete('/projects/{projectId}/attachments/{attachmentId}', [\App\Http\Controllers\ProjectAttachmentController::class, 'destroy']);
    Route::get('/projects/{projectId}/attachments/{attachmentId}/download', [\App\Http\Controllers\ProjectAttachmentController::class, 'download']);

    // Project Comments
    Route::get('/projects/{id}/comments', [ProjectController::class, 'comments']);
    Route::post('/projects/{id}/comments', [ProjectController::class, 'addComment']);
    
    // Clients
    Route::get('/clients/stats', [ClientController::class, 'stats'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::apiResource('clients', ClientController::class)->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::get('/clients/{id}/history', [ClientController::class, 'history']);
    Route::get('/clients/{id}/activities', [ClientController::class, 'activities']);
    
    // SPH Management
    Route::get('/sph', [SphController::class, 'index'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::get('/sph/{id}', [SphController::class, 'show'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::post('/sph', [SphController::class, 'store'])->middleware('role:marketing,head_section');
    Route::put('/sph/{id}', [SphController::class, 'update'])->middleware('role:marketing,head_section');
    Route::delete('/sph/{id}', [SphController::class, 'destroy'])->middleware('role:marketing,head_section');
    Route::post('/sph/preview', [SphController::class, 'preview']);
    Route::post('/sph/{id}/generate', [SphController::class, 'generate']);
    Route::post('/sph/{id}/approve', [SphController::class, 'approve'])->middleware('role:approver,head_section,senior_manager,general_manager');
    Route::post('/sph/{id}/reject', [SphController::class, 'reject'])->middleware('role:approver,head_section,senior_manager,general_manager');
    Route::post('/sph/{id}/client-decision', [SphController::class, 'clientDecision'])->middleware('role:marketing,head_section');
    
    // Surat Audiensi
    Route::get('/audiensi/stats', [AudiensiController::class, 'stats'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::get('/audiensi', [AudiensiController::class, 'index'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::get('/audiensi/{id}', [AudiensiController::class, 'show'])->middleware('role:marketing,approver,head_section,senior_manager,general_manager');
    Route::post('/audiensi', [AudiensiController::class, 'store'])->middleware('role:marketing,head_section');
    Route::put('/audiensi/{id}', [AudiensiController::class, 'update'])->middleware('role:marketing,head_section');
    Route::delete('/audiensi/{id}', [AudiensiController::class, 'destroy'])->middleware('role:marketing,head_section');
    Route::post('/audiensi/{id}/generate', [AudiensiController::class, 'generate']);
    Route::post('/audiensi/{id}/approve', [AudiensiController::class, 'approve'])->middleware('role:approver,head_section,senior_manager,general_manager');
    Route::post('/audiensi/{id}/reject', [AudiensiController::class, 'reject'])->middleware('role:approver,head_section,senior_manager,general_manager');
    Route::post('/audiensi/{id}/client-decision', [AudiensiController::class, 'clientDecision'])->middleware('role:marketing,head_section');
    Route::get('/audiensi-templates', [AudiensiController::class, 'templates'])->middleware('role:marketing,head_section');
    Route::post('/audiensi-templates', [AudiensiController::class, 'storeTemplate'])->middleware('role:marketing,head_section');
    Route::delete('/audiensi-templates/{id}', [AudiensiController::class, 'destroyTemplate']);
    
    // Activity Feed
    Route::post('/activities/offline', [ActivityController::class, 'offline']);
    Route::get('/activities/online-users', [ActivityController::class, 'getOnlineUsers']);
    Route::get('/activities/deadlines', [ActivityController::class, 'getUpcomingDeadlines']);
    Route::get('/activities/users', [ActivityController::class, 'getUsers']);
    Route::post('/activities/{id}/like', [ActivityController::class, 'like']);
    Route::post('/activities/{id}/comment', [ActivityController::class, 'comment']);
    Route::apiResource('activities', ActivityController::class);
    
    // Calendar
    Route::get('/calendar/events', [CalendarController::class, 'events']);
    Route::post('/calendar/events', [CalendarController::class, 'store']);
    Route::put('/calendar/events/{id}', [CalendarController::class, 'update']);
    Route::delete('/calendar/events/{id}', [CalendarController::class, 'destroy']);
    
    // Marketing Plan (Kanban)
    Route::get('/marketing-plan/columns', [MarketingPlanController::class, 'columns']);
    Route::post('/marketing-plan/tasks', [MarketingPlanController::class, 'store']);
    Route::put('/marketing-plan/tasks/{id}', [MarketingPlanController::class, 'update']);
    Route::delete('/marketing-plan/tasks/{id}', [MarketingPlanController::class, 'destroy']);
    Route::put('/marketing-plan/tasks/{id}/move', [MarketingPlanController::class, 'move']);
    Route::get('/marketing-plan/tasks/{id}/comments', [MarketingPlanController::class, 'comments']);
    Route::post('/marketing-plan/tasks/{id}/comments', [MarketingPlanController::class, 'addComment']);
    Route::get('/marketing-plan/tasks/{id}/history', [MarketingPlanController::class, 'history']);
    Route::get('/marketing-plan/tasks/{id}/attachments', [MarketingPlanController::class, 'attachments']);
    Route::post('/marketing-plan/tasks/{id}/attachments', [MarketingPlanController::class, 'addAttachment']);
    Route::delete('/marketing-plan/tasks/{taskId}/attachments/{attachmentId}', [MarketingPlanController::class, 'deleteAttachment']);
    
    // Essential Documents
    // Essential Documents (Admin only)
    Route::get('/essential-documents', [\App\Http\Controllers\EssentialDocumentController::class, 'index'])->middleware('role:marketing');
    Route::post('/essential-documents', [\App\Http\Controllers\EssentialDocumentController::class, 'store'])->middleware('role:marketing');
    Route::get('/essential-documents/{id}/download', [\App\Http\Controllers\EssentialDocumentController::class, 'download'])->middleware('role:marketing');
    Route::delete('/essential-documents/{id}', [\App\Http\Controllers\EssentialDocumentController::class, 'destroy'])->middleware('role:marketing');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/count', [NotificationController::class, 'count']);
    Route::get('/notifications/projects', [NotificationController::class, 'getProjects']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/all', [NotificationController::class, 'deleteAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Users & Settings
    Route::get('/users/profile', [UserController::class, 'profile']);
    Route::put('/users/profile', [UserController::class, 'updateProfile']);
    Route::put('/users/password', [UserController::class, 'updatePassword']);
    Route::get('/users', [UserController::class, 'index'])->middleware('role:marketing');
    Route::post('/users', [UserController::class, 'store'])->middleware('role:marketing');
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('role:marketing');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('role:marketing');
    Route::post('/register', [AuthController::class, 'register'])->middleware('role:marketing');
    
    // Invite Codes (Admin only)
    Route::post('/invite-codes/generate', [UserController::class, 'generateInviteCode'])->middleware('role:marketing');
    Route::get('/invite-codes', [UserController::class, 'listInviteCodes'])->middleware('role:marketing');
    

    // Activity Logs (Admin only)
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->middleware('role:marketing');

    // User Tutorials
    Route::get('/user-tutorials', [UserTutorialController::class, 'index']);
    Route::post('/user-tutorials', [UserTutorialController::class, 'store']);
});