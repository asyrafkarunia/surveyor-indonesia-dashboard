<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $permissions = [
            // Dashboard
            [
                'name' => 'view_dashboard',
                'description' => 'Can view dashboard statistics',
                'category' => 'Dashboard',
            ],
            
            // Activity Feed
            [
                'name' => 'view_activity_feed',
                'description' => 'Can view activity feed',
                'category' => 'Activity Feed',
            ],
            [
                'name' => 'create_post',
                'description' => 'Can create new posts',
                'category' => 'Activity Feed',
            ],
            
            // Projects
            [
                'name' => 'view_projects',
                'description' => 'Can view project list',
                'category' => 'Projects',
            ],
            [
                'name' => 'create_project',
                'description' => 'Can create new projects',
                'category' => 'Projects',
            ],
            [
                'name' => 'monitor_projects',
                'description' => 'Can access project monitoring',
                'category' => 'Projects',
            ],
            [
                'name' => 'approve_projects',
                'description' => 'Can approve projects',
                'category' => 'Projects',
            ],
            
            // Marketing
            [
                'name' => 'view_marketing_kanban',
                'description' => 'Can view marketing kanban',
                'category' => 'Marketing',
            ],
            [
                'name' => 'manage_clients',
                'description' => 'Can manage clients',
                'category' => 'Marketing',
            ],
            
            // SPH
            [
                'name' => 'manage_sph',
                'description' => 'Can manage SPH documents',
                'category' => 'SPH',
            ],
            
            // Audiensi
            [
                'name' => 'manage_audiensi',
                'description' => 'Can manage audiensi letters',
                'category' => 'Audiensi',
            ],
            
            // Settings
            [
                'name' => 'manage_users',
                'description' => 'Can manage users and roles',
                'category' => 'Settings',
            ],
            [
                'name' => 'manage_permissions',
                'description' => 'Can manage permissions',
                'category' => 'Settings',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                array_merge($permission, ['is_enabled' => true])
            );
        }
    }
}