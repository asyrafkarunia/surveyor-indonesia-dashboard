<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('client');
            $table->enum('priority', ['High', 'Medium', 'Low'])->default('Medium');
            $table->date('date');
            $table->foreignId('assignee_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['ide_baru', 'review', 'sph', 'berjalan', 'selesai'])->default('ide_baru');
            $table->json('tags')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_tasks');
    }
};
