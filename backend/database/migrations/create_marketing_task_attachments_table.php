<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('marketing_task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketing_task_id')
                ->constrained('marketing_tasks')
                ->onDelete('cascade');
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('label')->nullable();
            $table->string('url', 2048);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_task_attachments');
    }
};