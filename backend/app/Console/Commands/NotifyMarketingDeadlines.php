<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;

class NotifyMarketingDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:marketing-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Beritahu tim marketing jika ada proyek yang tenggat waktunya kurang dari 1 bulan';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $targetDate = now()->addDays(30);

        // Cari proyek yang running/pending dengan deadline kurang dari 1 bulan dan tidak kurang dari hari ini
        $projects = Project::whereIn('status', ['RUNNING', 'PENDING'])
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<=', $targetDate->toDateString())
            ->whereDate('end_date', '>=', now()->toDateString())
            ->get();

        if ($projects->isEmpty()) {
            $this->info('Tidak ada proyek yang mendekati tenggat waktu.');
            return;
        }

        // Ambil semua admin marketing
        $marketingUsers = User::where('role', 'marketing')->get();

        if ($marketingUsers->isEmpty()) {
            $this->info('Tidak ditemukan user marketing.');
            return;
        }

        $notifiedCount = 0;

        foreach ($projects as $project) {
            foreach ($marketingUsers as $user) {
                // Pastikan belum ada notifikasi serupa agar tidak spam tiap hari
                $exists = Notification::where('user_id', $user->id)
                    ->where('project_id', $project->id)
                    ->where('type', 'deadline_warning')
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'type' => 'deadline_warning',
                        'title' => 'Tenggat Waktu Proyek Mendekat',
                        'content' => "Proyek '{$project->title}' memiliki sisa waktu kurang dari 1 bulan sebelum tenggat waktu (" . Carbon::parse($project->end_date)->format('d/m/Y') . ").",
                        'project_name' => $project->title,
                        'tag' => 'SISTEM',
                        'is_read' => false,
                    ]);
                    $notifiedCount++;
                }
            }
        }

        $this->info("Berhasil mengirim {$notifiedCount} notifikasi tenggat waktu proyek.");
    }
}
