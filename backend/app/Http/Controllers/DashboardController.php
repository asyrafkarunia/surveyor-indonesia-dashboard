<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sph;
use App\Models\AudiensiLetter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        // Get date range from request
        $startMonth = $request->get('start_month', 1);
        $startYear = $request->get('start_year', date('Y'));
        $endMonth = $request->get('end_month', 12);
        $endYear = $request->get('end_year', date('Y'));
        
        $startDate = sprintf('%04d-%02d-01', $startYear, $startMonth);
        $endDate = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $endYear, $endMonth)));
        
        // Anggaran (nilai kontrak) & Aktualisasi (nilai real terserap) dari proyek dalam rentang tanggal.
        // Anggaran = budget, Aktualisasi = actual_revenue.
        $totalBudget = Project::whereBetween('start_date', [$startDate, $endDate])
            ->sum('budget') ?? 0;

        $totalActual = Project::whereBetween('start_date', [$startDate, $endDate])
            ->sum('actual_revenue') ?? 0;

        // SPH Issued (within date range)
        $sphIssued = Sph::whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Win Rate untuk Audiensi:
        // (jumlah audiensi accepted / (accepted + rejected)) * 100
        $acceptedAudiensi = AudiensiLetter::where('status', 'accepted')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $rejectedAudiensi = AudiensiLetter::where('status', 'rejected')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $totalDecision = $acceptedAudiensi + $rejectedAudiensi;
        $winRate = $totalDecision > 0 ? round(($acceptedAudiensi / $totalDecision) * 100, 1) : 0;

        // Running Projects (current running projects, not filtered by date range)
        $runningProjects = Project::where('status', 'RUNNING')->count();

        // Calculate previous period for comparison
        $prevStartDate = date('Y-m-01', strtotime($startDate . ' -1 month'));
        $prevEndDate = date('Y-m-t', strtotime($endDate . ' -1 month'));
        
        $prevTotalBudget = Project::whereBetween('start_date', [$prevStartDate, $prevEndDate])
            ->sum('budget') ?? 0;

        $prevTotalActual = Project::whereBetween('start_date', [$prevStartDate, $prevEndDate])
            ->sum('actual_revenue') ?? 0;
        
        $prevSphIssued = Sph::whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->count();
        
        $budgetTrend = $prevTotalBudget > 0
            ? round((($totalBudget - $prevTotalBudget) / $prevTotalBudget) * 100, 1)
            : 0;

        $actualTrend = $prevTotalActual > 0
            ? round((($totalActual - $prevTotalActual) / $prevTotalActual) * 100, 1)
            : 0;
        
        $sphTrend = $prevSphIssued > 0
            ? round((($sphIssued - $prevSphIssued) / $prevSphIssued) * 100, 1)
            : 0;

        $formatCurrency = function($amount) {
            if ($amount >= 1000000000) {
                return 'Rp ' . number_format($amount / 1000000000, 1, ',', '.') . ' M';
            } elseif ($amount >= 1000000) {
                return 'Rp ' . number_format($amount / 1000000, 1, ',', '.') . ' JT';
            } else {
                return 'Rp ' . number_format($amount, 0, ',', '.');
            }
        };

        return response()->json([
            'totalBudget' => $totalBudget,
            'totalBudgetFormatted' => $formatCurrency($totalBudget),
            'totalActual' => $totalActual,
            'totalActualFormatted' => $formatCurrency($totalActual),
            'sphIssued' => $sphIssued,
            'winRate' => $winRate,
            'runningProjects' => $runningProjects,
            'budgetTrend' => $budgetTrend,
            'actualTrend' => $actualTrend,
            'sphTrend' => $sphTrend,
        ]);
    }

    public function revenue(Request $request)
    {
        $startMonth = $request->get('start_month', 1);
        $startYear = $request->get('start_year', date('Y'));
        $endMonth = $request->get('end_month', 12);
        $endYear = $request->get('end_year', date('Y'));
        
        $startDate = sprintf('%04d-%02d-01', $startYear, $startMonth);
        $endDate = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $endYear, $endMonth)));
        
        // Get all months in the range
        $revenueData = [];
        $current = strtotime($startDate);
        $end = strtotime($endDate);
        
        while ($current <= $end) {
            $month = (int)date('m', $current);
            $year = (int)date('Y', $current);
            $monthStart = date('Y-m-01', $current);
            $monthEnd = date('Y-m-t', $current);
            
            // Anggaran = budget, Aktualisasi = actual_revenue (tidak tergantung status)
            $projection = Project::whereBetween('start_date', [$monthStart, $monthEnd])
                ->sum('budget') ?? 0;
            
            $realization = Project::whereBetween('start_date', [$monthStart, $monthEnd])
                ->sum('actual_revenue') ?? 0;
            
            $revenueData[] = [
                'month' => date('M', $current),
                'projection' => (float) $projection,
                'realization' => (float) $realization,
            ];
            
            $current = strtotime('+1 month', $current);
        }

        return response()->json($revenueData);
    }

    public function topProjects(Request $request)
    {
        $projects = Project::with(['client', 'pic'])
            ->orderBy('progress', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->title,
                    'client' => $project->client->company_name ?? 'N/A',
                    'status' => $project->status,
                    'progress' => $project->progress,
                ];
            });

        return response()->json($projects);
    }

    public function recentActivities(Request $request)
    {
        $activities = \App\Models\Activity::with(['user', 'project'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'user' => $activity->user->name,
                    'action' => $activity->content,
                    'target' => $activity->project->title ?? 'General',
                    'time' => $activity->created_at->diffForHumans(),
                ];
            });

        return response()->json($activities);
    }
}
