<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
            }
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
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
}
