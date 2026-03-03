<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->integer('duration_days')->default(1)->after('date');
            $table->date('end_date')->nullable()->after('duration_days');
            $table->boolean('is_recurring')->default(false)->after('type');
            $table->enum('recurring_frequency', ['daily', 'weekly', 'monthly', 'yearly'])->nullable()->after('is_recurring');
            $table->integer('recurring_interval')->default(1)->after('recurring_frequency');
            $table->enum('recurring_end_type', ['never', 'date', 'count'])->nullable()->after('recurring_interval');
            $table->date('recurring_end_date')->nullable()->after('recurring_end_type');
            $table->integer('recurring_count')->nullable()->after('recurring_end_date');
            $table->string('color')->default('#d33131')->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropColumn([
                'duration_days',
                'end_date',
                'is_recurring',
                'recurring_frequency',
                'recurring_interval',
                'recurring_end_type',
                'recurring_end_date',
                'recurring_count',
                'color'
            ]);
        });
    }
};
