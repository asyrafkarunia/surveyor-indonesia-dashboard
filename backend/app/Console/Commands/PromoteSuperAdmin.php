<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteSuperAdmin extends Command
{
    protected $signature = 'user:promote-super-admin {email : The email of the user to promote}';
    protected $description = 'Promote an existing user to Super Admin role';

    public function handle()
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }

        // Check if a super_admin already exists
        $existingSuperAdmin = User::where('role', 'super_admin')->first();
        if ($existingSuperAdmin && $existingSuperAdmin->id !== $user->id) {
            $this->warn("A Super Admin already exists: {$existingSuperAdmin->name} ({$existingSuperAdmin->email})");
            if (!$this->confirm('Do you want to replace the existing Super Admin? The previous one will be demoted to head_section.')) {
                $this->info('Operation cancelled.');
                return 0;
            }
            $existingSuperAdmin->update(['role' => 'head_section']);
            $this->info("Demoted {$existingSuperAdmin->name} to head_section.");
        }

        $oldRole = $user->role;
        $user->update([
            'role' => 'super_admin',
            'division' => $user->division ?: 'IT',
        ]);

        $this->info("✅ Successfully promoted {$user->name} ({$user->email}) to Super Admin.");
        $this->info("   Previous role: {$oldRole}");
        $this->info("   New role: super_admin");
        $this->newLine();
        $this->warn("⚠️  This account now has unrestricted access to the entire system.");

        return 0;
    }
}
