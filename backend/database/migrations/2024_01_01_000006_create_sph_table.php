<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sph', function (Blueprint $table) {
            $table->id();
            $table->string('sph_no')->unique();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->string('project_name');
            $table->decimal('value', 15, 2);
            $table->date('date_created');
            $table->enum('status', ['Draft', 'Sent', 'Approved', 'Rejected'])->default('Draft');
            $table->text('description')->nullable();
            $table->json('items')->nullable(); // SPH line items
            $table->string('generated_file_path')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sph');
    }
};
