<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize division name: 'Operations' -> 'Operasi'
     * This ensures consistent naming across the system.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereRaw("LOWER(TRIM(division)) = 'operations'")
            ->update(['division' => 'Operasi']);
    }

    public function down(): void
    {
        // Revert: 'Operasi' back to 'Operations' only for exact matches
        // Note: this is a best-effort rollback as there may be original 'Operasi' entries
        // No automatic rollback to avoid data loss
    }
};
