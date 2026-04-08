<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sph', function (Blueprint $table) {
            $table->text('scope_of_work')->nullable()->after('project_name');
            $table->string('time_period')->nullable()->after('terms_conditions');
            $table->text('term_payment')->nullable()->after('time_period');
            $table->string('bank_name')->default('Bank Mandiri cabang Pekanbaru')->after('term_payment');
            $table->string('bank_acc_no')->default('108.000.21704.97')->after('bank_name');
            $table->boolean('is_new_application')->default(false)->after('bank_acc_no');
            $table->integer('validity_months')->nullable()->after('validity_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sph', function (Blueprint $table) {
            $table->dropColumn([
                'scope_of_work',
                'time_period',
                'term_payment',
                'bank_name',
                'bank_acc_no',
                'is_new_application',
                'validity_months'
            ]);
        });
    }
};
