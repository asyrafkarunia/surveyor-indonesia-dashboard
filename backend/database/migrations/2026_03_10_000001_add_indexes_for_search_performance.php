<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Indexes for columns frequently used in search/filter queries.
     * Improves performance for LIKE searches and WHERE filters.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->index('company_name');
            $table->index('code');
            $table->index('contact_person');
            $table->index('status');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->index('status');
            $table->index('start_date');
        });

        Schema::table('sph', function (Blueprint $table) {
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['company_name']);
            $table->dropIndex(['code']);
            $table->dropIndex(['contact_person']);
            $table->dropIndex(['status']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['start_date']);
        });

        Schema::table('sph', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
