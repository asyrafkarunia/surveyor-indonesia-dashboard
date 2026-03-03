<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->whereIn('email', [
            'rimsal@ptsi.co.id',
            'rimsala@ptsi.co.id',
        ])->delete();
    }

    public function down(): void
    {
    }
};