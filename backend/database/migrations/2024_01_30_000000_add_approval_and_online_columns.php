<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add is_online to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_online')) {
                $table->boolean('is_online')->default(false)->nullable();
            }
        });

        // Add approval/rejection fields to sph table
        Schema::table('sph', function (Blueprint $table) {
            if (!Schema::hasColumn('sph', 'rejected_by')) {
                $table->foreignId('rejected_by')->nullable()->constrained('users');
                $table->timestamp('rejected_at')->nullable();
                $table->text('rejection_reason')->nullable();
            }
            // Ensure approved_by exists if not already
            if (!Schema::hasColumn('sph', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users');
                $table->timestamp('approved_at')->nullable();
            }
        });

        // Add approval/rejection fields to audiensi_letters table
        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (!Schema::hasColumn('audiensi_letters', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users');
                $table->timestamp('approved_at')->nullable();
            }
            if (!Schema::hasColumn('audiensi_letters', 'rejected_by')) {
                $table->foreignId('rejected_by')->nullable()->constrained('users');
                $table->timestamp('rejected_at')->nullable();
                $table->text('rejection_reason')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_online']);
        });

        Schema::table('sph', function (Blueprint $table) {
            $table->dropForeign(['rejected_by']);
            $table->dropColumn(['rejected_by', 'rejected_at', 'rejection_reason']);
        });

        Schema::table('audiensi_letters', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropColumn(['approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason']);
        });
    }
};