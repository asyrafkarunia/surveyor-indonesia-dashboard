<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('custom_pic_name')->nullable()->after('pic_id');
            $table->text('custom_team_notes')->nullable()->after('custom_pic_name');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['custom_pic_name', 'custom_team_notes']);
        });
    }
};
