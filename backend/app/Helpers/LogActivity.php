<?php

namespace App\Helpers;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class LogActivity
{
    /**
     * Log an activity
     *
     * @param string $action Action description (e.g., "Created User", "Updated Project")
     * @param string $module Module name (e.g., "Users", "Projects", "SPH")
     * @param string|null $actionTarget Target of the action (e.g., "User #123", "Project PROJ-001")
     * @param string $status Status: 'Success', 'Failed', 'Warning'
     * @param array|null $metadata Additional metadata
     * @param int|null $userId User ID (defaults to authenticated user)
     * @return ActivityLog
     */
    public static function log(
        string $action,
        string $module,
        ?string $actionTarget = null,
        string $status = 'Success',
        ?array $metadata = null,
        ?int $userId = null
    ): ActivityLog {
        $userId = $userId ?? Auth::id();

        return ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'action_target' => $actionTarget,
            'module' => $module,
            'status' => $status,
            'metadata' => $metadata ?? [],
        ]);
    }

    /**
     * Log user login
     */
    public static function logLogin(int $userId, string $status = 'Success'): ActivityLog
    {
        return self::log(
            'Login',
            'Auth',
            null,
            $status,
            ['ip_address' => request()->ip(), 'user_agent' => request()->userAgent()],
            $userId
        );
    }

    /**
     * Log user logout
     */
    public static function logLogout(int $userId): ActivityLog
    {
        return self::log(
            'Logout',
            'Auth',
            null,
            'Success',
            ['ip_address' => request()->ip()],
            $userId
        );
    }

    /**
     * Log user creation
     */
    public static function logUserCreated(int $userId, string $targetUserName, ?int $createdBy = null): ActivityLog
    {
        return self::log(
            'Created User',
            'Users',
            $targetUserName,
            'Success',
            ['user_id' => $userId],
            $createdBy
        );
    }

    /**
     * Log user update
     */
    public static function logUserUpdated(int $userId, string $targetUserName, array $changes, ?int $updatedBy = null): ActivityLog
    {
        return self::log(
            'Updated User',
            'Users',
            $targetUserName,
            'Success',
            ['user_id' => $userId, 'changes' => $changes],
            $updatedBy
        );
    }

    /**
     * Log user deletion
     */
    public static function logUserDeleted(int $userId, string $targetUserName, ?int $deletedBy = null): ActivityLog
    {
        return self::log(
            'Deleted User',
            'Users',
            $targetUserName,
            'Success',
            ['user_id' => $userId],
            $deletedBy
        );
    }

    /**
     * Log password change
     */
    public static function logPasswordChanged(int $userId, ?int $changedBy = null): ActivityLog
    {
        return self::log(
            'Changed Password',
            'Users',
            null,
            'Success',
            ['user_id' => $userId],
            $changedBy ?? $userId
        );
    }

    /**
     * Log project creation
     */
    public static function logProjectCreated(int $projectId, string $projectTitle, ?int $createdBy = null): ActivityLog
    {
        return self::log(
            'Created Project',
            'Projects',
            $projectTitle,
            'Success',
            ['project_id' => $projectId],
            $createdBy
        );
    }

    /**
     * Log project update
     */
    public static function logProjectUpdated(int $projectId, string $projectTitle, array $changes, ?int $updatedBy = null): ActivityLog
    {
        return self::log(
            'Updated Project',
            'Projects',
            $projectTitle,
            'Success',
            ['project_id' => $projectId, 'changes' => $changes],
            $updatedBy
        );
    }

    /**
     * Log project approval
     */
    public static function logProjectApproved(int $projectId, string $projectTitle, ?int $approvedBy = null): ActivityLog
    {
        return self::log(
            'Approved Project',
            'Projects',
            $projectTitle,
            'Success',
            ['project_id' => $projectId],
            $approvedBy
        );
    }

    /**
     * Log project rejection
     */
    public static function logProjectRejected(int $projectId, string $projectTitle, ?int $rejectedBy = null): ActivityLog
    {
        return self::log(
            'Rejected Project',
            'Projects',
            $projectTitle,
            'Success',
            ['project_id' => $projectId],
            $rejectedBy
        );
    }

    /**
     * Log permission update
     */
    public static function logPermissionUpdated(int $userId, string $userName, array $permissions, ?int $updatedBy = null): ActivityLog
    {
        return self::log(
            'Updated Permissions',
            'Permissions',
            $userName,
            'Success',
            ['user_id' => $userId, 'permissions' => $permissions],
            $updatedBy
        );
    }

    /**
     * Log marketing task creation
     */
    public static function logMarketingTaskCreated(int $taskId, string $taskTitle, ?int $createdBy = null): ActivityLog
    {
        return self::log(
            'Created Marketing Task',
            'Marketing',
            $taskTitle,
            'Success',
            ['task_id' => $taskId],
            $createdBy
        );
    }

    /**
     * Log marketing task update
     */
    public static function logMarketingTaskUpdated(int $taskId, string $taskTitle, ?int $updatedBy = null): ActivityLog
    {
        return self::log(
            'Updated Marketing Task',
            'Marketing',
            $taskTitle,
            'Success',
            ['task_id' => $taskId],
            $updatedBy
        );
    }

    /**
     * Log marketing task deletion
     */
    public static function logMarketingTaskDeleted(int $taskId, string $taskTitle, ?int $deletedBy = null): ActivityLog
    {
        return self::log(
            'Deleted Marketing Task',
            'Marketing',
            $taskTitle,
            'Success',
            ['task_id' => $taskId],
            $deletedBy
        );
    }

    /**
     * Log client creation
     */
    public static function logClientCreated(int $clientId, string $clientName, ?int $createdBy = null): ActivityLog
    {
        return self::log(
            'Created Client',
            'Clients',
            $clientName,
            'Success',
            ['client_id' => $clientId],
            $createdBy
        );
    }

    /**
     * Log client update
     */
    public static function logClientUpdated(int $clientId, string $clientName, array $changes, ?int $updatedBy = null): ActivityLog
    {
        return self::log(
            'Updated Client',
            'Clients',
            $clientName,
            'Success',
            ['client_id' => $clientId, 'changes' => $changes],
            $updatedBy
        );
    }

    /**
     * Log SPH creation
     */
    public static function logSphCreated(int $sphId, string $sphNumber, ?int $createdBy = null): ActivityLog
    {
        return self::log(
            'Created SPH',
            'SPH Mgmt',
            $sphNumber,
            'Success',
            ['sph_id' => $sphId],
            $createdBy
        );
    }

    /**
     * Log SPH approval
     */
    public static function logSphApproved(int $sphId, string $sphNumber, ?int $approvedBy = null): ActivityLog
    {
        return self::log(
            'Approved SPH',
            'SPH Mgmt',
            $sphNumber,
            'Success',
            ['sph_id' => $sphId],
            $approvedBy
        );
    }
}
