<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = App\Models\User::latest()->get();
foreach ($users as $user) {
    echo "ID: " . $user->id . " | Name: " . $user->name . " | Phone: '" . $user->phone . "'\n";
}
