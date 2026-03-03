<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\User;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        
        if ($userId) {
            // Get permissions for specific user
            $user = User::findOrFail($userId);
            $permissions = Permission::all()->groupBy('category');

            $categories = $permissions->map(function ($perms, $category) use ($user) {
                return [
                    'id' => strtolower(str_replace(' ', '_', $category)),
                    'title' => $category,
                    'description' => 'Permissions for ' . $category,
                    'icon' => $this->getCategoryIcon($category),
                    'permissions' => $perms->map(function ($perm) use ($user) {
                        $userPermission = DB::table('user_permissions')
                            ->where('user_id', $user->id)
                            ->where('permission_id', $perm->id)
                            ->first();
                        
                        return [
                            'id' => $perm->id,
                            'name' => $perm->name,
                            'description' => $perm->description,
                            'isEnabled' => $userPermission ? (bool)$userPermission->is_enabled : $perm->is_enabled,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'user' => $user,
                'categories' => $categories,
            ]);
        } else {
            // Get all permissions grouped by category
            $permissions = Permission::all()->groupBy('category');

            $categories = $permissions->map(function ($perms, $category) {
                return [
                    'id' => strtolower(str_replace(' ', '_', $category)),
                    'title' => $category,
                    'description' => 'Permissions for ' . $category,
                    'icon' => $this->getCategoryIcon($category),
                    'permissions' => $perms->map(function ($perm) {
                        return [
                            'id' => $perm->id,
                            'name' => $perm->name,
                            'description' => $perm->description,
                            'isEnabled' => $perm->is_enabled,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json($categories);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'is_enabled' => 'required|boolean',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $permission = Permission::findOrFail($id);

        if ($request->has('user_id')) {
            // Update user-specific permission
            $userId = $request->user_id;
            
            DB::table('user_permissions')->updateOrInsert(
                [
                    'user_id' => $userId,
                    'permission_id' => $id,
                ],
                [
                    'is_enabled' => $request->is_enabled,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            return response()->json([
                'message' => 'User permission updated successfully',
            ]);
        } else {
            // Update global permission
            $permission->update([
                'is_enabled' => $request->is_enabled,
            ]);

            return response()->json($permission);
        }
    }

    public function updateBulk(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'permissions' => 'required|array',
            'permissions.*.id' => 'required|exists:permissions,id',
            'permissions.*.is_enabled' => 'required|boolean',
        ]);

        $userId = $request->user_id;
        $user = User::findOrFail($userId);

        foreach ($request->permissions as $perm) {
            DB::table('user_permissions')->updateOrInsert(
                [
                    'user_id' => $userId,
                    'permission_id' => $perm['id'],
                ],
                [
                    'is_enabled' => $perm['is_enabled'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Log permission update
        LogActivity::logPermissionUpdated(
            $userId,
            $user->name,
            $request->permissions,
            $request->user()->id ?? null
        );

        return response()->json([
            'message' => 'Permissions updated successfully',
        ]);
    }

    private function getCategoryIcon($category)
    {
        $icons = [
            'Manajemen SPH' => 'description',
            'Data Klien' => 'group',
            'Laporan & Analitik' => 'bar_chart',
            'Proyek' => 'folder',
            'Marketing' => 'campaign',
            'Audiensi' => 'mail',
            'Kalendar' => 'calendar_month',
            'Notifikasi' => 'notifications',
        ];

        return $icons[$category] ?? 'settings';
    }
}
