<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InviteCode;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Log failed login attempt
            if ($user) {
                LogActivity::logLogin($user->id, 'Failed');
            } else {
                LogActivity::logFailedLoginAttempt($request->email);
            }
            throw ValidationException::withMessages([
                'email' => ['Alamat email atau password salah.'],
            ]);
        }

        // --- ENFORCE EMAIL VERIFICATION ---
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email Anda belum terverifikasi. Silakan cek email Anda untuk melakukan verifikasi.',
                'not_verified' => true,
                'email' => $user->email,
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Log successful login
        LogActivity::logLogin($user->id, 'Success');
        
        // Update last activity timestamp
        $user->last_activity_at = now();
        $user->is_online = true;
        $user->save(); // Update status

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:marketing,common,approver,head_section,senior_manager,general_manager',
            'division' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'division' => $request->division,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Validate an invite code (public endpoint)
     */
    public function validateInviteCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:8',
        ]);

        $inviteCode = InviteCode::where('code', strtoupper($request->code))->first();

        if (!$inviteCode) {
            return response()->json([
                'valid' => false,
                'message' => 'Kode undangan tidak ditemukan.',
            ], 404);
        }

        if ($inviteCode->used_by) {
            return response()->json([
                'valid' => false,
                'message' => 'Kode undangan sudah pernah digunakan.',
            ], 422);
        }

        if ($inviteCode->expires_at->isPast()) {
            return response()->json([
                'valid' => false,
                'message' => 'Kode undangan sudah kedaluwarsa.',
            ], 422);
        }

        if (!$inviteCode->is_active) {
            return response()->json([
                'valid' => false,
                'message' => 'Kode undangan tidak aktif.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Kode undangan valid.',
        ]);
    }

    /**
     * Register a new user with an invite code (public endpoint)
     */
    public function registerWithInvite(Request $request)
    {
        try {
            $request->validate([
                'invite_code' => 'required|string|size:8',
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:5|confirmed',
                'division' => 'required|string|max:255',
            ]);

            // Validate invite code
            $inviteCode = InviteCode::where('code', strtoupper($request->invite_code))->first();

            if (!$inviteCode || !$inviteCode->isValid()) {
                return response()->json([
                    'message' => 'Kode undangan tidak valid, sudah digunakan, atau kedaluwarsa.',
                ], 422);
            }

            // Create user with default 'common' role
            $user = User::create([
                'name' => trim($request->name),
                'email' => strtolower(trim($request->email)),
                'password' => Hash::make($request->password),
                'role' => 'common',
                'division' => trim($request->division),
                'status' => 'Aktif',
            ]);

            // Mark invite code as used
            $inviteCode->markAsUsed($user->id);

            // Trigger Email Verification Event
            event(new Registered($user));

            // Log registration
            Log::info('User registered via invite code', [
                'user_id' => $user->id,
                'invite_code' => $inviteCode->code,
                'invited_by' => $inviteCode->created_by,
            ]);

            return response()->json([
                'message' => 'Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi sebelum login.',
                'user' => $user,
                'requires_verification' => true,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat akun. Silakan coba lagi.',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Log logout before deleting token
        if ($user) {
            LogActivity::logLogout($user->id);
        }
        
        $request->user()->currentAccessToken()->delete();
        
        // Clear last activity on logout
        if ($user) {
            $user->last_activity_at = null;
            $user->is_online = false;
            $user->save();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Forgot Password - Send reset link
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Link reset password telah dikirim ke email Anda.'])
            : response()->json(['message' => 'Gagal mengirim email reset password.'], 400);
    }

    /**
     * Reset Password - Handle new password submission
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:5',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password berhasil diubah. Silakan login kembali.'])
            : response()->json(['message' => 'Link reset password sudah tidak valid atau kedaluwarsa.'], 400);
    }

    /**
     * Verify Email - Handle verification link click
     */
    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect(env('FRONTEND_URL') . '?verified=error&message=Link tidak valid');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect(env('FRONTEND_URL') . '?verified=already&message=Email sudah pernah diverifikasi');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect(env('FRONTEND_URL') . '?verified=success&message=Email berhasil diverifikasi');
    }

    /**
     * Resend Verification Email
     */
    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email sudah terverifikasi.'], 400);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email verifikasi telah dikirim ulang.']);
    }
}
