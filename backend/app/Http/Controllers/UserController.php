<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InviteCode;
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
            'phone' => 'nullable|string|max:20',
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

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:5120',
        ]);

        $user = $request->user();
        
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            
            // Delete old avatar if exists and not default
            if ($user->avatar && str_contains($user->avatar, '/storage/avatars/')) {
                $oldPath = str_replace('/storage/', '', $user->avatar);
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldPath)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                }
            }
            
            $fullUrl = url('/storage/' . $path);
            $user->update(['avatar' => $fullUrl]);
            return response()->json(['avatar' => $fullUrl]);
        }
        
        return response()->json(['message' => 'No file uploaded'], 400);
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
                'role' => 'required|in:super_admin,marketing,common,approver,head_section,senior_manager,general_manager',
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
        $actor = $request->user();
        
        $oldData = $user->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:super_admin,marketing,common,approver,head_section,senior_manager,general_manager',
            'division' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Aktif,Cuti,Nonaktif',
        ]);

        // === HIERARCHY ENFORCEMENT ===
        $isSelf = $actor->id === $user->id;
        
        // super_admin can edit anyone
        if ($actor->role !== 'super_admin') {
            // No one can edit super_admin except themselves
            if ($user->role === 'super_admin' && !$isSelf) {
                return response()->json(['message' => 'Tidak dapat mengubah akun Super Admin.'], 403);
            }
            
            // head_section can edit everyone except super_admin (already handled above)
            if ($actor->role === 'head_section') {
                // allowed for all non-super_admin
            }
            // marketing can only edit users with lower privilege
            elseif ($actor->role === 'marketing') {
                if (!$isSelf && in_array($user->role, ['marketing', 'head_section', 'super_admin'])) {
                    return response()->json(['message' => 'Tidak dapat mengubah akun dengan hak akses yang sama atau lebih tinggi.'], 403);
                }
            }
            // other roles cannot edit other users
            else {
                if (!$isSelf) {
                    return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah akun pengguna lain.'], 403);
                }
            }
            
            // If editing self, cannot change own role
            if ($isSelf && isset($validated['role']) && $validated['role'] !== $actor->role) {
                return response()->json(['message' => 'Tidak dapat mengubah role Anda sendiri.'], 403);
            }
        }

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

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $actor = $request->user();
        $userName = $user->name;
        
        // Cannot delete yourself
        if ($actor->id === $user->id) {
            return response()->json(['message' => 'Tidak dapat menghapus akun Anda sendiri.'], 403);
        }

        // Cannot delete super_admin
        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Akun Super Admin tidak dapat dihapus.'], 403);
        }

        // Privileged accounts can only be deleted by super_admin
        $privilegedRoles = ['marketing', 'head_section', 'approver', 'senior_manager', 'general_manager'];
        if (in_array($user->role, $privilegedRoles) && $actor->role !== 'super_admin') {
            return response()->json(['message' => 'Hanya Super Admin yang dapat menghapus akun dengan hak akses tinggi.'], 403);
        }
        
        // Log user deletion before deleting
        LogActivity::logUserDeleted($user->id, $userName, $actor->id ?? null);
        
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Generate a new invite code (Admin only)
     */
    public function generateInviteCode(Request $request)
    {
        try {
            $request->validate([
                'role' => 'sometimes|in:super_admin,marketing,common,approver,head_section,senior_manager,general_manager',
                'division' => 'sometimes|string|max:255',
            ]);

            $code = InviteCode::generateUniqueCode();

            $inviteCode = InviteCode::create([
                'code' => $code,
                'role' => $request->input('role', 'common'),
                'division' => $request->input('division', ''),
                'created_by' => $request->user()->id,
                'expires_at' => now()->addHours(72),
                'is_active' => true,
            ]);

            return response()->json([
                'message' => 'Kode undangan berhasil dibuat.',
                'invite_code' => $inviteCode->load('creator'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Invite code generation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat kode undangan.',
            ], 500);
        }
    }

    /**
     * List all invite codes (Admin only)
     */
    public function listInviteCodes(Request $request)
    {
        $inviteCodes = InviteCode::with(['creator:id,name', 'usedByUser:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($inviteCodes);
    }
}
