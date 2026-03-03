<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('location_address')->nullable()->after('description');
            $table->decimal('latitude', 10, 8)->nullable()->after('location_address');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->string('project_type')->nullable()->after('longitude');
            $table->decimal('target_margin', 5, 2)->nullable()->after('budget');
            $table->text('compliance_requirements')->nullable()->after('target_margin');
            $table->string('quality_standard')->nullable()->after('compliance_requirements');
            $table->string('target_compliance')->nullable()->after('quality_standard');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'location_address',
                'latitude',
                'longitude',
                'project_type',
                'target_margin',
                'compliance_requirements',
                'quality_standard',
                'target_compliance'
            ]);
        });
    }
};
