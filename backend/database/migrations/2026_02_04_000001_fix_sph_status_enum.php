<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Debug output to verify file is loaded
        echo "Running SPH Enum Fix...\n";
        
        // Add lowercase accepted to SPH enum
        // NOTE: Changed 'Rejected' to 'rejected' to match lowercase convention and avoid potential duplicates if DB is case-insensitive
        DB::statement("ALTER TABLE sph MODIFY COLUMN status ENUM('Draft', 'Sent', 'Approved', 'rejected', 'waiting_head_section', 'waiting_senior_manager', 'waiting_general_manager', 'waiting_client', 'accepted') DEFAULT 'Draft'");
    }

    public function down(): void
    {
        // Revert is complex, skipping for now
    }
};