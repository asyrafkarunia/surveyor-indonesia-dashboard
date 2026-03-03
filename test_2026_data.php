<?php

use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Controllers\ProjectController;

require __DIR__ . '/backend/vendor/autoload.php';
$app = require __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate Request for 2026
$request = Request::create('/api/projects/monitoring-stats', 'GET', ['year' => 2026]);
$controller = new ProjectController();
$response = $controller->monitoringStats($request);

echo "Status Code: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

// Check raw projects in DB for 2026
$count = Project::where(function($q) {
    $q->whereYear('start_date', '<=', 2026)
      ->where(function($q2) {
          $q2->whereYear('end_date', '>=', 2026)
             ->orWhereNull('end_date');
      });
})->count();

echo "Raw DB Count for 2026: " . $count . "\n";
