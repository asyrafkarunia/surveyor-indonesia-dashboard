<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'division' => 'nullable|string',
            'avatar' => 'nullable|string',
        ]);

        if ($request->has('password')) {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function updatePassword(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:5',
            ]);

            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Kata sandi saat ini tidak benar',
                ], 422);
            }

            // Update password
            $user->update([
                'password' => Hash::make($validated['new_password']),
            ]);
            
            // Log password change
            LogActivity::logPasswordChanged($user->id, $user->id);

            return response()->json([
                'message' => 'Password updated successfully',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Password update error: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return response()->json([
                'message' => 'Gagal memperbarui kata sandi. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $users = User::latest()->paginate(20);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:5',
                'role' => 'required|in:marketing,common,approver,head_section,senior_manager,general_manager',
                'division' => 'required|string|max:255',
                'status' => 'nullable|in:Aktif,Cuti,Nonaktif',
            ]);

            $user = User::create([
                'name' => trim($validated['name']),
                'email' => strtolower(trim($validated['email'])),
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'division' => trim($validated['division']),
                'status' => $validated['status'] ?? 'Aktif',
            ]);

            // Log user creation
            LogActivity::logUserCreated($user->id, $user->name, $request->user()->id ?? null);

            return response()->json([
                'message' => 'User created successfully',
                'user' => $user,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('User creation error: ' . $e->getMessage(), ['admin_id' => $request->user()->id ?? null]);
            return response()->json([
                'message' => 'Gagal membuat akun pengguna. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $oldData = $user->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:marketing,common,approver,head_section,senior_manager,general_manager',
            'division' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Aktif,Cuti,Nonaktif',
        ]);

        $user->update($validated);
        
        // Log user update with changes
        $changes = [];
        foreach ($validated as $key => $value) {
            if (isset($oldData[$key]) && $oldData[$key] != $value) {
                $changes[$key] = ['old' => $oldData[$key], 'new' => $value];
            }
        }
        
        if (!empty($changes)) {
            LogActivity::logUserUpdated($user->id, $user->name, $changes, $request->user()->id ?? null);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $userName = $user->name;
        
        // Log user deletion before deleting
        LogActivity::logUserDeleted($user->id, $userName, request()->user()->id ?? null);
        
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }
}
