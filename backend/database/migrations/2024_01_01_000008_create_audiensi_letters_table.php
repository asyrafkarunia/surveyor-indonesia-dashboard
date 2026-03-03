<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audiensi_letters', function (Blueprint $table) {
            $table->id();
            $table->string('letter_number')->unique();
            $table->date('date');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->string('sector');
            $table->string('purpose');
            $table->foreignId('template_id')->nullable()->constrained('audiensi_templates')->onDelete('set null');
            $table->text('content')->nullable();
            $table->string('generated_file_path')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audiensi_letters');
    }
};
