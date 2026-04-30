<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');
        
        $user = $request->user();
        // Restrict marketing role to only see their own activity logs
        if (!in_array($user->role, ['head_section', 'super_admin']) && $user->role === 'marketing') {
            $query->where('user_id', $user->id);
        }

        // Filter by module
        if ($request->has('module') && $request->module) {
            $query->where('module', $request->module);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action type (single - for backward compatibility)
        if ($request->has('action_type') && $request->action_type && $request->action_type !== 'All Actions') {
            $actionType = $request->action_type;
            
            // Map action type categories to specific actions
            $actionMap = $this->getActionTypeMap();
            
            if (isset($actionMap[$actionType])) {
                // If it's a category, search for all actions in that category
                $actions = $actionMap[$actionType];
                $query->where(function($q) use ($actions) {
                    foreach ($actions as $action) {
                        $q->orWhere('action', 'like', "%{$action}%");
                    }
                });
            } else {
                // If it's a specific action, search for that action
                $query->where('action', 'like', "%{$actionType}%");
            }
        }

        // Filter by multiple action types (array)
        if ($request->has('action_types') && is_array($request->action_types) && count($request->action_types) > 0) {
            $actionTypes = $request->action_types;
            $actionMap = $this->getActionTypeMap();
            $allActions = [];
            
            // Collect all actions from selected categories/types
            foreach ($actionTypes as $actionType) {
                if (isset($actionMap[$actionType])) {
                    // If it's a category, add all actions in that category
                    $allActions = array_merge($allActions, $actionMap[$actionType]);
                } else {
                    // If it's a specific action, add it directly
                    $allActions[] = $actionType;
                }
            }
            
            // Remove duplicates
            $allActions = array_unique($allActions);
            
            if (count($allActions) > 0) {
                $query->where(function($q) use ($allActions) {
                    foreach ($allActions as $action) {
                        $q->orWhere('action', 'like', "%{$action}%");
                    }
                });
            }
        }

        // Search by action or action_target
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('action_target', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Date range filter
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->input('per_page', 15);
        $perPage = min(5000, max(1, (int)$perPage));

        $logs = $query->latest()->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Map action type categories to specific actions
     */
    private function getActionTypeMap(): array
    {
        return [
            // Authentication
            'Authentication' => ['Login', 'Logout'],
            'Login' => ['Login'],
            'Logout' => ['Logout'],
            
            // User Management
            'User Management' => ['Created User', 'Updated User', 'Deleted User', 'Changed Password'],
            'User Created' => ['Created User'],
            'User Updated' => ['Updated User'],
            'User Deleted' => ['Deleted User'],
            'Password Changed' => ['Changed Password'],
            
            // Project Management
            'Project Management' => ['Created Project', 'Updated Project', 'Approved Project', 'Rejected Project'],
            'Project Created' => ['Created Project'],
            'Project Updated' => ['Updated Project'],
            'Project Approved' => ['Approved Project'],
            'Project Rejected' => ['Rejected Project'],
            
            // Marketing
            'Marketing' => ['Created Marketing Task', 'Updated Marketing Task', 'Deleted Marketing Task', 'Moved Marketing Task'],
            'Marketing Task Created' => ['Created Marketing Task'],
            'Marketing Task Updated' => ['Updated Marketing Task'],
            'Marketing Task Deleted' => ['Deleted Marketing Task'],
            'Marketing Task Moved' => ['Moved Marketing Task'],
            
            // Client Management
            'Client Management' => ['Created Client', 'Updated Client', 'Deleted Client'],
            'Client Created' => ['Created Client'],
            'Client Updated' => ['Updated Client'],
            'Client Deleted' => ['Deleted Client'],
            
            // SPH Management
            'SPH Management' => ['Created SPH', 'Approved SPH'],
            'SPH Created' => ['Created SPH'],
            'SPH Approved' => ['Approved SPH'],
            
            // Permissions
            'Permissions' => ['Updated Permissions'],
            'Permissions Updated' => ['Updated Permissions'],
            
            // Generic actions (for backward compatibility)
            'Create' => ['Created', 'Created User', 'Created Project', 'Created Client', 'Created SPH', 'Created Marketing Task'],
            'Update' => ['Updated', 'Updated User', 'Updated Project', 'Updated Client', 'Updated Marketing Task', 'Updated Permissions'],
            'Delete' => ['Deleted', 'Deleted User', 'Deleted Client', 'Deleted Marketing Task'],
            'Approve' => ['Approved', 'Approved Project', 'Approved SPH'],
        ];
    }
}
