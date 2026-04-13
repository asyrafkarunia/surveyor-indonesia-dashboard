<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add super_admin to the enum in users table
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('marketing', 'common', 'approver', 'head_section', 'senior_manager', 'general_manager', 'super_admin') DEFAULT 'common'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back without super_admin
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('marketing', 'common', 'approver', 'head_section', 'senior_manager', 'general_manager') DEFAULT 'common'");
    }
};
