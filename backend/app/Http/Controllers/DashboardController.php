<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Project;
use App\Models\Sph;
use App\Models\AudiensiLetter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $startMonth = $request->get('start_month', 1);
        $startYear  = $request->get('start_year', date('Y'));
        $endMonth   = $request->get('end_month', 12);
        $endYear    = $request->get('end_year', date('Y'));

        $cacheKey = "dashboard_stats_{$startYear}_{$startMonth}_{$endYear}_{$endMonth}";

        $data = Cache::remember($cacheKey, 60, function () use ($startYear, $startMonth, $endYear, $endMonth) {
            $startDate = sprintf('%04d-%02d-01', $startYear, $startMonth);
            $endDate   = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $endYear, $endMonth)));

            $totalBudget = Project::whereBetween('start_date', [$startDate, $endDate])->sum('budget') ?? 0;
            $totalActual = Project::whereBetween('start_date', [$startDate, $endDate])->sum('actual_revenue') ?? 0;

            $sphIssued = Sph::whereBetween('created_at', [$startDate, $endDate])->count();

            $acceptedAudiensi = AudiensiLetter::where('status', 'accepted')
                ->whereBetween('created_at', [$startDate, $endDate])->count();
            $rejectedAudiensi = AudiensiLetter::where('status', 'rejected')
                ->whereBetween('created_at', [$startDate, $endDate])->count();
            $totalDecision = $acceptedAudiensi + $rejectedAudiensi;
            $winRate = $totalDecision > 0 ? round(($acceptedAudiensi / $totalDecision) * 100, 1) : 0;

            $runningProjects = Project::where('status', 'RUNNING')
                ->where(function ($q) use ($startDate, $endDate) {
                    $q->where('start_date', '<=', $endDate)
                      ->where(function ($q2) use ($startDate) {
                          $q2->where('end_date', '>=', $startDate)->orWhereNull('end_date');
                      });
                })->count();

            $prevStartDate = date('Y-m-01', strtotime($startDate . ' -1 year'));
            $prevEndDate   = date('Y-m-t', strtotime($endDate . ' -1 year'));

            $prevTotalBudget = Project::whereBetween('start_date', [$prevStartDate, $prevEndDate])->sum('budget') ?? 0;
            $prevTotalActual = Project::whereBetween('start_date', [$prevStartDate, $prevEndDate])->sum('actual_revenue') ?? 0;
            $prevSphIssued   = Sph::whereBetween('created_at', [$prevStartDate, $prevEndDate])->count();

            $budgetTrend = $prevTotalBudget > 0 ? round((($totalBudget - $prevTotalBudget) / $prevTotalBudget) * 100, 1) : 0;
            $actualTrend = $prevTotalActual > 0 ? round((($totalActual - $prevTotalActual) / $prevTotalActual) * 100, 1) : 0;
            $sphTrend    = $prevSphIssued > 0 ? round((($sphIssued - $prevSphIssued) / $prevSphIssued) * 100, 1) : 0;

            $fmt = fn($v) => $v >= 1_000_000_000
                ? 'Rp ' . number_format($v / 1_000_000_000, 1, ',', '.') . ' M'
                : ($v >= 1_000_000 ? 'Rp ' . number_format($v / 1_000_000, 1, ',', '.') . ' JT' : 'Rp ' . number_format($v, 0, ',', '.'));

            return [
                'totalBudget'          => $totalBudget,
                'totalBudgetFormatted' => $fmt($totalBudget),
                'totalActual'          => $totalActual,
                'totalActualFormatted' => $fmt($totalActual),
                'sphIssued'            => $sphIssued,
                'winRate'              => $winRate,
                'runningProjects'      => $runningProjects,
                'budgetTrend'          => $budgetTrend,
                'actualTrend'          => $actualTrend,
                'sphTrend'             => $sphTrend,
            ];
        });

        return response()->json($data);
    }

    public function revenue(Request $request)
    {
        $startMonth = $request->get('start_month', 1);
        $startYear  = $request->get('start_year', date('Y'));
        $endMonth   = $request->get('end_month', 12);
        $endYear    = $request->get('end_year', date('Y'));

        $cacheKey = "dashboard_revenue_{$startYear}_{$startMonth}_{$endYear}_{$endMonth}";

        $revenueData = Cache::remember($cacheKey, 60, function () use ($startYear, $startMonth, $endYear, $endMonth) {
            $startDate = sprintf('%04d-%02d-01', $startYear, $startMonth);
            $endDate   = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $endYear, $endMonth)));

            $result  = [];
            $current = strtotime($startDate);
            $end     = strtotime($endDate);

            while ($current <= $end) {
                $monthStart = date('Y-m-01', $current);
                $monthEnd   = date('Y-m-t', $current);

                $projection  = Project::whereBetween('start_date', [$monthStart, $monthEnd])->sum('budget') ?? 0;
                $realization = Project::whereBetween('start_date', [$monthStart, $monthEnd])->sum('actual_revenue') ?? 0;

                $result[] = [
                    'month'       => date('M', $current),
                    'projection'  => (float) $projection,
                    'realization' => (float) $realization,
                ];

                $current = strtotime('+1 month', $current);
            }

            return $result;
        });

        return response()->json($revenueData);
    }

    public function topProjects(Request $request)
    {
        $projects = Cache::remember('dashboard_top_projects', 60, function () {
            $fmt = fn($v) => $v >= 1_000_000_000
                ? 'Rp ' . number_format($v / 1_000_000_000, 1, ',', '.') . ' M'
                : ($v >= 1_000_000 ? 'Rp ' . number_format($v / 1_000_000, 1, ',', '.') . ' JT' : 'Rp ' . number_format($v, 0, ',', '.'));

            return Project::with(['client', 'pic'])
                ->orderBy('progress', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'id'            => $p->id,
                    'name'          => $p->title,
                    'client'        => $p->client->company_name ?? 'N/A',
                    'status'        => $p->status,
                    'progress'      => $p->progress,
                    'budget'        => $p->budget,
                    'budgetFormatted' => $fmt($p->budget ?? 0),
                    'endDate'       => $p->end_date,
                    'pic'           => $p->pic->name ?? null,
                ]);
        });

        return response()->json($projects);
    }

    public function recentActivities(Request $request)
    {
        $activities = Cache::remember('dashboard_recent_activities', 30, function () {
            return Activity::with(['user', 'project'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn($a) => [
                    'id'     => $a->id,
                    'type'   => $a->type,
                    'user'   => $a->user->name,
                    'action' => $a->content,
                    'target' => $a->project->title ?? 'General',
                    'time'   => $a->created_at->diffForHumans(),
                ]);
        });

        return response()->json($activities);
    }
}

