<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update Rimsal's role to head_section
        DB::table('users')
            ->whereIn('email', ['rimsal@ptsi.co.id', 'rimsala@ptsi.co.id'])
            ->update(['role' => 'head_section']);
    }

    public function down(): void
    {
        // Revert to marketing
        DB::table('users')
            ->whereIn('email', ['rimsal@ptsi.co.id', 'rimsala@ptsi.co.id'])
            ->update(['role' => 'marketing']);
    }
};