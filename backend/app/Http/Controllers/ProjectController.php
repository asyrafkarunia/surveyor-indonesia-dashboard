<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAttachment;
use App\Models\ProjectComment;
use App\Models\Notification;
use App\Models\User;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['client', 'pic', 'marketingPic']);

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('year')) {
            $year = $request->year;
            $query->where(function($q) use ($year) {
                $q->whereYear('start_date', '<=', $year)
                  ->where(function($q2) use ($year) {
                      $q2->whereYear('end_date', '>=', $year)
                         ->orWhereNull('end_date');
                  });
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $projects = $query->latest()->paginate(15);

        return response()->json($projects);
    }

    public function monitoringStats(Request $request)
    {
        $year = $request->get('year', date('Y'));
        
        // Get projects active in the year (start <= year AND end >= year)
        $query = Project::where(function($q) use ($year) {
            $q->whereYear('start_date', '<=', $year)
              ->where(function($q2) use ($year) {
                  $q2->whereYear('end_date', '>=', $year)
                     ->orWhereNull('end_date');
              });
        });
        
        // Total projects
        $totalProjects = (clone $query)->count();
        
        // New vs Carry-over
        $newProjectsCount = (clone $query)->whereYear('start_date', $year)->count();
        $carryOverCount = (clone $query)->whereYear('start_date', '<', $year)->count();
        
        // Projects by status
        $pendingProjects = (clone $query)->where('status', 'PENDING')->count();
        $runningProjects = (clone $query)->where('status', 'RUNNING')->count();
        $doneProjects = (clone $query)->where('status', 'DONE')->count();
        $rejectedProjects = (clone $query)->where('status', 'REJECTED')->count();
        
        // Delayed Projects (Running AND end_date < today)
        $delayedCount = (clone $query)
            ->where('status', 'RUNNING')
            ->where('end_date', '<', now())
            ->count();
            
        // Calculate percentages
        $pendingPercent = $totalProjects > 0 ? round(($pendingProjects / $totalProjects) * 100, 1) : 0;
        $runningPercent = $totalProjects > 0 ? round(($runningProjects / $totalProjects) * 100, 1) : 0;
        $donePercent = $totalProjects > 0 ? round(($doneProjects / $totalProjects) * 100, 1) : 0;
        $rejectedPercent = $totalProjects > 0 ? round(($rejectedProjects / $totalProjects) * 100, 1) : 0;
        
        // Get previous year for comparison
        $prevYear = $year - 1;
        
        // Get projects active in the previous year (start <= prevYear AND end >= prevYear)
        $prevQuery = Project::where(function($q) use ($prevYear) {
            $q->whereYear('start_date', '<=', $prevYear)
              ->where(function($q2) use ($prevYear) {
                  $q2->whereYear('end_date', '>=', $prevYear)
                     ->orWhereNull('end_date');
              });
        });

        $prevTotalProjects = (clone $prevQuery)->count();
        $totalTrend = $prevTotalProjects > 0 
            ? round((($totalProjects - $prevTotalProjects) / $prevTotalProjects) * 100, 1)
            : 0;
        
        $prevRunningProjects = (clone $prevQuery)->where('status', 'RUNNING')->count();
        $runningTrend = $prevRunningProjects > 0
            ? round((($runningProjects - $prevRunningProjects) / $prevRunningProjects) * 100, 1)
            : 0;
        
        $prevDoneProjects = (clone $prevQuery)->where('status', 'DONE')->count();
        $doneTrend = $prevDoneProjects > 0
            ? round((($doneProjects - $prevDoneProjects) / $prevDoneProjects) * 100, 1)
            : 0;
        
        // Portfolio distribution MUST be based on project_type (category of work), not status.
        $typeGroups = (clone $query)
            ->selectRaw("COALESCE(NULLIF(project_type, ''), 'Uncategorized') as category, COUNT(*) as count")
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        $portfolioData = $typeGroups->map(function ($row) use ($totalProjects) {
            $count = (int) $row->count;
            $percentage = $totalProjects > 0 ? round(($count / $totalProjects) * 100, 1) : 0;
            return [
                'category' => $row->category,
                'count' => $count,
                'percentage' => $percentage,
            ];
        });
        
        return response()->json([
            'totalProjects' => $totalProjects,
            'newProjectsCount' => $newProjectsCount,
            'carryOverCount' => $carryOverCount,
            'pendingProjects' => $pendingProjects,
            'runningProjects' => $runningProjects,
            'doneProjects' => $doneProjects,
            'rejectedProjects' => $rejectedProjects,
            'delayedCount' => $delayedCount,
            'pendingPercent' => $pendingPercent,
            'runningPercent' => $runningPercent,
            'donePercent' => $donePercent,
            'rejectedPercent' => $rejectedPercent,
            'totalTrend' => $totalTrend,
            'runningTrend' => $runningTrend,
            'doneTrend' => $doneTrend,
            'portfolioData' => $portfolioData,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'pic_id' => 'nullable|exists:users,id',
            'pic_marketing_id' => 'nullable|exists:users,id',
            'custom_pic_name' => 'nullable|string|max:255',
            'custom_team_notes' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'actual_revenue' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'location_address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'project_type' => 'nullable|string',
            'target_margin' => 'nullable|numeric|min:0|max:100',
            'compliance_requirements' => 'nullable|string',
            'quality_standard' => 'nullable|string',
            'target_compliance' => 'nullable|string',
            'is_tender' => 'required|boolean',
            'payment_terms' => 'nullable|array',
            'payment_terms.*.percentage' => 'nullable|numeric',
            'payment_terms.*.amount' => 'nullable|numeric',
            'payment_terms.*.term_date' => 'nullable|date',
            'payment_terms.*.pic_name' => 'nullable|string',
            'team_members' => 'nullable|array',
            'team_members.*' => 'nullable|integer|exists:users,id',
            'locations' => 'nullable|array',
            'locations.*.address' => 'required|string',
            'locations.*.latitude' => 'required|numeric',
            'locations.*.longitude' => 'required|numeric',
        ]);

        $validated['progress'] = 0;
        $validated['status'] = 'PENDING';
        $validated['approval_status'] = 'pending';

        // If custom PIC provided, override pic_id
        if (!empty($validated['custom_pic_name'])) {
            $validated['pic_id'] = null;
        }

        $project = DB::transaction(function () use ($validated) {
            $year = date('Y');
            $prefix = 'PROJ-' . $year . '-';
            $lastCode = Project::where('code', 'like', $prefix . '%')
                ->orderBy('code', 'desc')
                ->lockForUpdate()
                ->value('code');
            $seq = 0;
            if ($lastCode) {
                $parts = explode('-', $lastCode);
                $seq = intval(end($parts));
            }
            $data = $validated;
            unset($data['payment_terms']);
            $data['code'] = $prefix . str_pad($seq + 1, 3, '0', STR_PAD_LEFT);
            $newProject = Project::create($data);

            if (!empty($validated['payment_terms'])) {
                foreach ($validated['payment_terms'] as $index => $term) {
                    $newProject->paymentTerms()->create([
                        'term_number' => $index + 1,
                        'term_date' => $term['term_date'] ?? null,
                        'percentage' => $term['percentage'] ?? null,
                        'amount' => $term['amount'] ?? null,
                        'pic_name' => $term['pic_name'] ?? null,
                    ]);
                }
            }
            return $newProject;
        });
        
        // Log project creation
        LogActivity::logProjectCreated($project->id, $project->title, $request->user()->id ?? null);

        // Send notifications to Approvers (Head Section, Senior Manager, General Manager)
        $targetRoles = ['head_section', 'senior_manager', 'general_manager'];
        $approvers = User::whereIn('role', $targetRoles)->get();
        
        foreach ($approvers as $approver) {
            Notification::create([
                'user_id' => $approver->id,
                'project_id' => $project->id,
                'type' => 'alert',
                'title' => 'Project Review Needed',
                'content' => "Proyek '{$project->title}' dari klien '{$project->client->company_name}' perlu di-review.",
                'project_name' => $project->title,
                'tag' => 'approval',
                'is_read' => false,
                'data' => ['kind' => 'project_needs_review'],
            ]);
        }

        return response()->json($project->load(['client', 'pic', 'marketingPic']), 201);
    }

    public function show($id)
    {
        $project = Project::with(['client', 'pic', 'marketingPic', 'attachments', 'comments.user', 'paymentTerms'])
            ->findOrFail($id);
            
        if (!empty($project->team_members)) {
            $project->team_member_users = collect($project->team_members)->map(function ($userId) {
                return User::find($userId);
            })->filter()->values();
        } else {
            $project->team_member_users = [];
        }

        return response()->json($project);
    }

    public function detail($id)
    {
        return $this->show($id);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        if (!$request->user() || !$request->user()->canUpdateProject()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $oldData = $project->toArray();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'progress' => 'sometimes|integer|min:0|max:100',
            'status' => 'sometimes|in:RUNNING,PENDING,DONE,REJECTED',
            'budget' => 'nullable|numeric|min:0',
            'actual_revenue' => 'nullable|numeric|min:0',
            'project_type' => 'nullable|string',
            'description' => 'nullable|string',
            'location_address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'target_margin' => 'nullable|numeric|min:0|max:100',
            'compliance_requirements' => 'nullable|string',
            'quality_standard' => 'nullable|string',
            'target_compliance' => 'nullable|string',
            'is_tender' => 'sometimes|boolean',
            'pic_id' => 'nullable|exists:users,id',
            'pic_marketing_id' => 'nullable|exists:users,id',
            'custom_pic_name' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|array',
            'payment_terms.*.percentage' => 'nullable|numeric',
            'payment_terms.*.amount' => 'nullable|numeric',
            'payment_terms.*.term_date' => 'nullable|date',
            'payment_terms.*.pic_name' => 'nullable|string',
            'team_members' => 'nullable|array',
            'team_members.*' => 'nullable|integer|exists:users,id',
            'locations' => 'nullable|array',
            'locations.*.address' => 'required|string',
            'locations.*.latitude' => 'required|numeric',
            'locations.*.longitude' => 'required|numeric',
            'schedule_data' => 'nullable|array',
        ]);

        $oldActual = null;
        $newActual = null;
        $deltaActual = null;

        if (array_key_exists('actual_revenue', $validated)) {
            $oldActual = isset($oldData['actual_revenue']) ? (float) $oldData['actual_revenue'] : 0.0;
            $newActual = (float) $validated['actual_revenue'];

            if ($newActual > $oldActual) {
                $deltaActual = $newActual - $oldActual;
            }
        }

        // Handle PIC conflicts in update
        if (array_key_exists('custom_pic_name', $validated) && !empty($validated['custom_pic_name'])) {
            $validated['pic_id'] = null;
        } elseif (array_key_exists('pic_id', $validated) && !empty($validated['pic_id'])) {
            $validated['custom_pic_name'] = null;
        }


        $dataToUpdate = $validated;
        unset($dataToUpdate['payment_terms']);
        $project->update($dataToUpdate);
        
        if (array_key_exists('payment_terms', $validated)) {
            $project->paymentTerms()->delete();
            if (!empty($validated['payment_terms'])) {
                foreach ($validated['payment_terms'] as $index => $term) {
                    $project->paymentTerms()->create([
                        'term_number' => $index + 1,
                        'term_date' => $term['term_date'] ?? null,
                        'percentage' => $term['percentage'] ?? null,
                        'amount' => $term['amount'] ?? null,
                        'pic_name' => $term['pic_name'] ?? null,
                    ]);
                }
            }
        }
        
        $changes = [];
        foreach ($validated as $key => $value) {
            if (isset($oldData[$key]) && $oldData[$key] != $value) {
                $changes[$key] = ['old' => $oldData[$key], 'new' => $value];
            }
        }
        
        if (!empty($changes)) {
            LogActivity::logProjectUpdated($project->id, $project->title, $changes, $request->user()->id ?? null);
        }

        if ($deltaActual !== null && $newActual !== null && $oldActual !== null) {
            LogActivity::log(
                'Project Actualization Updated',
                'Projects',
                $project->code ?? $project->title,
                'Success',
                [
                    'project_id' => $project->id,
                    'client_id' => $project->client_id,
                    'contract_code' => $project->code ?? $project->title,
                    'project_title' => $project->title,
                    'old_actual_revenue' => $oldActual,
                    'new_actual_revenue' => $newActual,
                    'delta_actual_revenue' => $deltaActual,
                    'project_status' => $project->status,
                    'budget' => $project->budget,
                ],
                $request->user()->id ?? null
            );
        }

        return response()->json($project->load(['client', 'pic']));
    }

    public function comments($id)
    {
        $project = Project::findOrFail($id);

        $comments = $project->comments()
            ->with('user')
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function addComment(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $comment = ProjectComment::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $projectTitle = $project->title;
        
        // Log project deletion before deleting
        LogActivity::log(
            'Deleted Project',
            'Projects',
            $projectTitle,
            'Success',
            ['project_id' => $project->id],
            request()->user()->id ?? null
        );
        
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function approve(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        
        $project->update([
            'approval_status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);
        
        // Log project approval
        LogActivity::logProjectApproved($project->id, $project->title, $request->user()->id);

        // Notify Marketing PIC or creator
        $recipientId = $project->pic_marketing_id ?: $project->created_by;
        if ($recipientId) {
            Notification::create([
                'user_id' => $recipientId,
                'project_id' => $project->id,
                'type' => 'system',
                'title' => 'Proyek Disetujui',
                'content' => "Proyek '{$project->title}' telah DISETUJUI oleh Approver.",
                'project_name' => $project->title,
                'tag' => 'Project Approval',
                'is_read' => false,
                'data' => ['project_id' => $project->id, 'kind' => 'project_approved'],
            ]);
        }

        return response()->json($project->load(['client', 'pic', 'marketingPic']));
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $project = Project::findOrFail($id);
        
        $project->update([
            'approval_status' => 'rejected',
            'status' => 'REJECTED',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        // Notify Marketing PIC or creator
        $recipientId = $project->pic_marketing_id ?: $project->created_by;
        if ($recipientId) {
            Notification::create([
                'user_id' => $recipientId,
                'project_id' => $project->id,
                'type' => 'alert',
                'title' => 'Proyek Ditolak',
                'content' => "Proyek '{$project->title}' telah DITOLAK. Alasan: " . substr($request->rejection_reason, 0, 100),
                'project_name' => $project->title,
                'tag' => 'Project Rejection',
                'is_read' => false,
                'data' => ['project_id' => $project->id, 'kind' => 'project_rejected'],
            ]);
        }

        return response()->json($project->load(['client', 'pic', 'marketingPic']));
    }
}
