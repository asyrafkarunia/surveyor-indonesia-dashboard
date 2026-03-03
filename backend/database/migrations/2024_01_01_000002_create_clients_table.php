<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('company_name');
            $table->string('logo')->nullable();
            $table->string('contact_person');
            $table->string('contact_role');
            $table->enum('type', ['BUMN', 'Swasta', 'Pemerintah']);
            $table->enum('status', ['Aktif', 'Non-Aktif', 'Suspended'])->default('Aktif');
            $table->string('email');
            $table->string('phone');
            $table->string('industry')->nullable();
            $table->string('location')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
