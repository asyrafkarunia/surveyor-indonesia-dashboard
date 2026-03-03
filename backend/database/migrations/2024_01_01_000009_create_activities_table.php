<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['project_update', 'alert', 'meeting', 'post']);
            $table->text('content');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->json('tags')->nullable();
            $table->string('attachment_name')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_type')->nullable();
            $table->integer('attachment_size')->nullable();
            $table->boolean('is_urgent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
