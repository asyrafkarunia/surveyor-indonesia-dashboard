<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (!Schema::hasColumn('audiensi_letters', 'is_new_application')) {
                $table->boolean('is_new_application')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (Schema::hasColumn('audiensi_letters', 'is_new_application')) {
                $table->dropColumn('is_new_application');
            }
        });
    }
};
