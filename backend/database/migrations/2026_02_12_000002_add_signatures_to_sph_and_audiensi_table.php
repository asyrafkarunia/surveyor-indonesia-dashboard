<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sph', function (Blueprint $table) {
            $table->string('senior_manager_signature')->nullable()->after('status');
            $table->string('general_manager_signature')->nullable()->after('senior_manager_signature');
            $table->date('validity_period')->nullable()->after('items');
            $table->text('terms_conditions')->nullable()->after('validity_period');
        });

        Schema::table('audiensi_letters', function (Blueprint $table) {
            $table->string('senior_manager_signature')->nullable()->after('status');
            $table->string('general_manager_signature')->nullable()->after('senior_manager_signature');
        });
    }

    public function down(): void
    {
        Schema::table('sph', function (Blueprint $table) {
            if (Schema::hasColumn('sph', 'senior_manager_signature')) {
                $table->dropColumn('senior_manager_signature');
            }
            if (Schema::hasColumn('sph', 'general_manager_signature')) {
                $table->dropColumn('general_manager_signature');
            }
            if (Schema::hasColumn('sph', 'validity_period')) {
                $table->dropColumn('validity_period');
            }
            if (Schema::hasColumn('sph', 'terms_conditions')) {
                $table->dropColumn('terms_conditions');
            }
        });

        Schema::table('audiensi_letters', function (Blueprint $table) {
            if (Schema::hasColumn('audiensi_letters', 'senior_manager_signature')) {
                $table->dropColumn('senior_manager_signature');
            }
            if (Schema::hasColumn('audiensi_letters', 'general_manager_signature')) {
                $table->dropColumn('general_manager_signature');
            }
        });
    }
};