<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (!Schema::hasColumn('audiensi_letters', 'position')) {
                $table->string('position')->after('purpose')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (Schema::hasColumn('audiensi_letters', 'position')) {
                $table->dropColumn('position');
            }
        });
    }
};