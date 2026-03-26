<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invite_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('used_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('used_at')->nullable();
            $table->dateTime('expires_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invite_codes');
    }
};
