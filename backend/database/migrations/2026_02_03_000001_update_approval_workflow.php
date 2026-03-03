<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update Users Role
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('marketing', 'common', 'approver', 'head_section', 'senior_manager', 'general_manager') DEFAULT 'common'");

        // Update Audiensi Letters Status
        // Default becomes 'waiting_head_section' for new items usually, but let's keep 'submitted' as initial state if needed, 
        // or effectively 'submitted' IS 'waiting_head_section'.
        // The user says: "status pada surat audiensi terdiri dari, menunggu persetujuan head section marketing..."
        // So 'submitted' might just be the initial state that immediately transitions or IS the state.
        // Let's use specific status names.
        DB::statement("ALTER TABLE audiensi_letters MODIFY COLUMN status ENUM('submitted', 'waiting_head_section', 'waiting_senior_manager', 'waiting_general_manager', 'waiting_client', 'accepted', 'rejected') DEFAULT 'waiting_head_section'");

        // Update SPH Status
        DB::statement("ALTER TABLE sph MODIFY COLUMN status ENUM('Draft', 'Sent', 'Approved', 'Rejected', 'waiting_head_section', 'waiting_senior_manager', 'waiting_general_manager', 'waiting_client') DEFAULT 'Draft'");
    }

    public function down(): void
    {
        // Reverting enums can be tricky if data exists with new values.
        // For development, we usually just accept the change.
    }
};