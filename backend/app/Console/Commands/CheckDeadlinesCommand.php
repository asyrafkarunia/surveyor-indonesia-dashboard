<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use App\Models\Project;
use App\Models\PaymentTerm;
use App\Models\CalendarEvent;
use App\Models\Notification;

class CheckDeadlinesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:check-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for upcoming project deadlines and payment terms to send notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking deadlines...');
        
        $today = \Carbon\Carbon::today();
        
        // 1. Check Project Deadlines (7 days and 3 days before)
        $this->checkProjectDeadlines($today);
        
        // 2. Check Payment Terms (3 days before)
        $this->checkPaymentTerms($today);
        
        // 3. Check Calendar Event Deadlines (1 day before)
        $this->checkCalendarDeadlines($today);
        
        $this->info('Deadline check completed.');
    }

    private function checkProjectDeadlines($today)
    {
        $deadlines = [7, 3, 1];
        
        foreach ($deadlines as $days) {
            $targetDate = $today->copy()->addDays($days);
            $projects = \App\Models\Project::where('status', 'RUNNING')
                ->whereDate('end_date', $targetDate)
                ->get();
            
            foreach ($projects as $project) {
                $recipientId = $project->pic_marketing_id ?: $project->pic_id;
                if (!$recipientId) continue;

                $this->createNotification(
                    $recipientId,
                    'alert',
                    "Deadline Proyek Dekat ({$days} hari)",
                    "Proyek '{$project->title}' memiliki deadline pada " . $project->end_date->format('d M Y') . ".",
                    $project->id,
                    $project->title,
                    'Deadline',
                    ['kind' => 'project_deadline_reminder', 'days_remaining' => $days]
                );
            }
        }
    }

    private function checkPaymentTerms($today)
    {
        $targetDate = $today->copy()->addDays(3);
        $terms = \App\Models\PaymentTerm::whereDate('term_date', $targetDate)
            ->with('project')
            ->get();
        
        foreach ($terms as $term) {
            $project = $term->project;
            if (!$project) continue;
            
            $recipientId = $project->pic_marketing_id ?: $project->pic_id;
            if (!$recipientId) continue;

            $this->createNotification(
                $recipientId,
                'finance',
                "Jatuh Tempo Pembayaran (Termin {$term->term_number})",
                "Pembayaran Termin {$term->term_number} untuk proyek '{$project->title}' jatuh tempo dalam 3 hari (" . $term->term_date->format('d M Y') . ").",
                $project->id,
                $project->title,
                'Payment',
                ['kind' => 'payment_reminder', 'term_id' => $term->id]
            );
        }
    }

    private function checkCalendarDeadlines($today)
    {
        $targetDate = $today->copy()->addDays(1);
        $events = \App\Models\CalendarEvent::where('type', 'deadline')
            ->whereDate('date', $targetDate)
            ->get();
        
        foreach ($events as $event) {
            $recipients = !empty($event->team_members) ? $event->team_members : [$event->user_id];
            
            foreach ($recipients as $userId) {
                $dateRange = Carbon::parse($event->date)->translatedFormat('d M Y');
                if ($event->end_date && $event->end_date !== $event->date) {
                    $dateRange .= ' - ' . Carbon::parse($event->end_date)->translatedFormat('d M Y');
                }
                
                $this->createNotification(
                    $userId,
                    'alert',
                    'Deadline Besok (Calendar)',
                    "Aktivitas deadline Anda besok: {$event->title} ({$dateRange})",
                    $event->project_id,
                    $event->project->title ?? 'Aktivitas Umum',
                    'Calendar',
                    ['event_id' => $event->id, 'kind' => 'calendar_deadline']
                );
            }
        }
    }

    private function createNotification($userId, $type, $title, $content, $projectId, $projectName, $tag, $data)
    {
        // Avoid duplicate notification for same target/data on same day if command is rerun
        $exists = Notification::query()
            ->where('user_id', $userId)
            ->where('title', $title)
            ->whereDate('created_at', Carbon::today()->toDateString())
            ->exists();
            
        if (!$exists) {
            Notification::create([
                'user_id' => $userId,
                'project_id' => $projectId,
                'type' => $type,
                'title' => $title,
                'content' => $content,
                'project_name' => $projectName,
                'tag' => $tag,
                'is_read' => false,
                'data' => $data,
            ]);
        }
    }
}
