<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\ActivityLog;
use App\Models\Activity;
use Illuminate\Support\Facades\DB;
use App\Models\CalendarEvent;
use App\Models\Client;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->status && $request->status !== 'Semua Status') {
            $query->where('status', $request->status);
        }

        // Type filter
        if ($request->has('type') && $request->type && $request->type !== 'Semua Tipe') {
            // Case-insensitive comparison for type
            $type = strtolower($request->type);
            $query->whereRaw('LOWER(type) = ?', [$type]);
        }

        $clients = $query->latest()->paginate(15);

        return response()->json($clients);
    }

    public function stats()
    {
        $total = Client::count();
        $active = Client::where('status', 'Aktif')->count();
        $inactive = Client::where('status', 'Non-Aktif')->count();
        $suspended = Client::where('status', 'Suspended')->count();

        // Calculate trends (compare with last month)
        $lastMonth = Carbon::now()->subMonth();
        $totalLastMonth = Client::where('created_at', '<', $lastMonth)->count();
        $activeLastMonth = Client::where('status', 'Aktif')
            ->where('created_at', '<', $lastMonth)
            ->count();
        $inactiveLastMonth = Client::where('status', 'Non-Aktif')
            ->where('created_at', '<', $lastMonth)
            ->count();

        $totalTrend = $totalLastMonth > 0 ? round((($total - $totalLastMonth) / $totalLastMonth) * 100, 1) : 0;
        $activeTrend = $activeLastMonth > 0 ? round((($active - $activeLastMonth) / $activeLastMonth) * 100, 1) : 0;
        $inactiveTrend = $inactiveLastMonth > 0 ? round((($inactive - $inactiveLastMonth) / $inactiveLastMonth) * 100, 1) : 0;

        return response()->json([
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'suspended' => $suspended,
            'trends' => [
                'total' => $totalTrend,
                'active' => $activeTrend,
                'inactive' => $inactiveTrend,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'contact_role' => 'required|string|max:255',
            'type' => 'required|in:BUMN,Swasta,Pemerintah',
            'email' => 'required|email',
            'phone' => 'required|string',
            'industry' => 'nullable|string',
            'location' => 'nullable|string',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
        ]);

        $client = DB::transaction(function () use ($validated) {
            // Lock existing rows to prevent race condition on code numbering
            $count = Client::lockForUpdate()->count() + 1;
            $validated['code'] = 'CLI-' . str_pad($count, 5, '0', STR_PAD_LEFT);
            $validated['status'] = 'Aktif';

            return Client::create($validated);
        });
        
        // Log client creation
        LogActivity::logClientCreated($client->id, $client->company_name, $request->user()->id ?? null);

        return response()->json($client, 201);
    }

    public function show($id)
    {
        $client = Client::with(['projects.paymentTerms', 'sph'])->findOrFail($id);

        $totalContractValue = $client->projects->sum('budget');

        $activeStatus = ['PENDING', 'RUNNING'];
        $activeProjectsCount = $client->projects->whereIn('status', $activeStatus)->count();

        $clientSince = $client->created_at->format('Y');
        
        $pendingInvoices = $client->projects
            ->filter(function ($project) {
                return in_array($project->status, ['RUNNING', 'DONE'], true);
            })
            ->sum(function ($project) {
                $budget = $project->budget ?? 0;
                $actual = $project->actual_revenue ?? 0;
                $remaining = $budget - $actual;
                return $remaining > 0 ? $remaining : 0;
            });

        $isInactiveSuggestion = false;
        
        if ($activeProjectsCount == 0) {
            $lastProject = $client->projects()->orderBy('end_date', 'desc')->first();
            
            if ($lastProject && $lastProject->end_date) {
                $diffInYears = Carbon::parse($lastProject->end_date)->diffInYears(now());
                if ($diffInYears >= 2) {
                    $isInactiveSuggestion = true;
                }
            } elseif ($client->created_at->diffInYears(now()) >= 2 && $client->projects()->count() == 0) {
                 $isInactiveSuggestion = true;
            }
        }

        $projectIds = $client->projects->pluck('id');

        $activities = Activity::whereIn('project_id', $projectIds)
                        ->with('user')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function($act) {
                            return [
                                'id' => $act->id,
                                'type' => $act->type ?? 'check',
                                'title' => $act->title ?? $act->content,
                                'note' => $act->content,
                                'tags' => $act->tags ?? [],
                                'by' => $act->user->name ?? 'System',
                                'time' => $act->created_at ? $act->created_at->format('Y-m-d H:i') : null,
                                'description' => '',
                            ];
                        });

        $projectsHistory = ActivityLog::where('module', 'Projects')
            ->where('action', 'Project Actualization Updated')
            ->where('metadata->client_id', $client->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) {
                $meta = $log->metadata ?? [];

                return [
                    'id' => $log->id,
                    'contract_code' => $meta['contract_code'] ?? $log->action_target,
                    'project_title' => $meta['project_title'] ?? null,
                    'project_status' => $meta['project_status'] ?? null,
                    'amount' => $meta['delta_actual_revenue'] ?? null,
                    'total_actual' => $meta['new_actual_revenue'] ?? null,
                    'budget' => $meta['budget'] ?? null,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json([
            'client' => $client,
            'stats' => [
                'total_contract_value' => $totalContractValue,
                'active_projects' => $activeProjectsCount,
                'total_projects' => $client->projects->count(),
                'pending_invoices' => $pendingInvoices,
                'client_since' => $clientSince,
            ],
            'is_inactive_suggestion' => $isInactiveSuggestion,
            'activities' => $activities,
            'projects_history' => $projectsHistory,
        ]);
    }

    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $oldData = $client->toArray();

        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'contact_person' => 'sometimes|string|max:255',
            'contact_role' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:BUMN,Swasta,Pemerintah',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string',
            'industry' => 'nullable|string',
            'location' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'sometimes|in:Aktif,Non-Aktif,Suspended',
            'logo' => 'nullable|string',
        ]);

        $client->update($validated);
        
        // Log client update with changes
        $changes = [];
        foreach ($validated as $key => $value) {
            if (isset($oldData[$key]) && $oldData[$key] != $value) {
                $changes[$key] = ['old' => $oldData[$key], 'new' => $value];
            }
        }
        
        if (!empty($changes)) {
            LogActivity::logClientUpdated($client->id, $client->company_name, $changes, $request->user()->id ?? null);
        }

        return response()->json($client);
    }

    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        $clientName = $client->company_name;
        
        // Log client deletion before deleting
        LogActivity::log(
            'Deleted Client',
            'Clients',
            $clientName,
            'Success',
            ['client_id' => $client->id],
            request()->user()->id ?? null
        );
        
        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }

    public function history($id)
    {
        $client = Client::findOrFail($id);

        $projectsHistory = ActivityLog::where('module', 'Projects')
            ->where('action', 'Project Actualization Updated')
            ->where('metadata->client_id', $client->id)
            ->latest()
            ->get()
            ->map(function ($log) {
                $meta = $log->metadata ?? [];

                return [
                    'id' => $log->id,
                    'contract_code' => $meta['contract_code'] ?? $log->action_target,
                    'project_title' => $meta['project_title'] ?? null,
                    'project_status' => $meta['project_status'] ?? null,
                    'amount' => $meta['delta_actual_revenue'] ?? null,
                    'total_actual' => $meta['new_actual_revenue'] ?? null,
                    'budget' => $meta['budget'] ?? null,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json([
            'projects_history' => $projectsHistory,
        ]);
    }

    public function activities($id)
    {
        $client = Client::with('projects')->findOrFail($id);

        $projectIds = $client->projects->pluck('id');

        $activityItems = Activity::whereIn('project_id', $projectIds)
            ->with(['user', 'project'])
            ->latest()
            ->get()
            ->map(function ($act) {
                return [
                    'id' => 'act-' . $act->id,
                    'activity_id' => $act->id,
                    'type' => $act->type,
                    'title' => $act->title ?? $act->content,
                    'note' => $act->content,
                    'tags' => $act->tags ?? [],
                    'description' => '',
                    'by' => $act->user->name ?? 'System',
                    'time' => $act->created_at ? $act->created_at->format('Y-m-d H:i') : null,
                    'project' => $act->project ? ['title' => $act->project->title] : null,
                    'source' => 'activity',
                ];
            });

        $calendarItems = CalendarEvent::whereIn('project_id', $projectIds)
            ->with(['user', 'project'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => 'cal-' . $event->id,
                    'event_id' => $event->id,
                    'type' => $event->type ?? 'meeting',
                    'title' => $event->title,
                    'description' => $event->description ?? '',
                    'by' => $event->user->name ?? 'Calendar',
                    'time' => $event->date ? $event->date->format('Y-m-d H:i') : null,
                    'project' => $event->project ? ['title' => $event->project->title] : null,
                    'source' => 'calendar',
                ];
            });

        $merged = $activityItems->concat($calendarItems)->sortByDesc('time')->values();

        return response()->json($merged);
    }
}