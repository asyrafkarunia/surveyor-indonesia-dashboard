<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default users with specific roles
        $users = [
            [
                'name' => 'Marketing Admin',
                'email' => 'marketing@ptsi.co.id',
                'password' => Hash::make('password'),
                'role' => 'marketing',
                'division' => 'Marketing',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Head Section',
                'email' => 'head@ptsi.co.id',
                'password' => Hash::make('password'),
                'role' => 'head_section',
                'division' => 'Operations',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Senior Manager',
                'email' => 'senior.manager@ptsi.co.id',
                'password' => Hash::make('password'),
                'role' => 'senior_manager',
                'division' => 'Management',
                'status' => 'Aktif',
            ],
            [
                'name' => 'General Manager',
                'email' => 'general.manager@ptsi.co.id',
                'password' => Hash::make('password'),
                'role' => 'general_manager',
                'division' => 'Management',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Rafi',
                'email' => 'rafi@ptsi.co.id',
                'password' => Hash::make('password'),
                'role' => 'marketing',
                'division' => 'Marketing',
                'status' => 'Aktif',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }

        // Create sample client
        Client::updateOrCreate(
            ['code' => 'CLI-00001'],
            [
                'company_name' => 'PT Pertamina (Persero)',
                'contact_person' => 'Arif Hidayat',
                'contact_role' => 'VP Procurement',
                'type' => 'BUMN',
                'status' => 'Aktif',
                'email' => 'arif.h@pertamina.com',
                'phone' => '0812-3456-7891',
                'industry' => 'Oil & Gas',
                'location' => 'Jakarta',
            ]
        );

    }
}
