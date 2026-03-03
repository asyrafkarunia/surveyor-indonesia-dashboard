<?php

namespace App\Http\Controllers;

use App\Models\MarketingTask;
use App\Models\MarketingTaskComment;
use App\Models\MarketingTaskAttachment;
use App\Models\ActivityLog;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;

class MarketingPlanController extends Controller
{
    public function columns(Request $request)
    {
        $columns = [
            [
                'id' => 'ide_baru',
                'title' => 'Ide Baru',
                'color' => 'border-blue-500',
                'cards' => MarketingTask::where('status', 'ide_baru')
                    ->with('assignee')
                    ->get()
                    ->map(function ($task) {
                        return $this->formatTask($task);
                    }),
            ],
            [
                'id' => 'review',
                'title' => 'Dalam Review',
                'color' => 'border-yellow-500',
                'cards' => MarketingTask::where('status', 'review')
                    ->with('assignee')
                    ->get()
                    ->map(function ($task) {
                        return $this->formatTask($task);
                    }),
            ],
            [
                'id' => 'sph',
                'title' => 'Persiapan SPH',
                'color' => 'border-orange-500',
                'cards' => MarketingTask::where('status', 'sph')
                    ->with('assignee')
                    ->get()
                    ->map(function ($task) {
                        return $this->formatTask($task);
                    }),
            ],
            [
                'id' => 'berjalan',
                'title' => 'Sedang Berjalan',
                'color' => 'border-red-500',
                'cards' => MarketingTask::where('status', 'berjalan')
                    ->with('assignee')
                    ->get()
                    ->map(function ($task) {
                        return $this->formatTask($task);
                    }),
            ],
            [
                'id' => 'selesai',
                'title' => 'Selesai',
                'color' => 'border-green-500',
                'cards' => MarketingTask::where('status', 'selesai')
                    ->with('assignee')
                    ->get()
                    ->map(function ($task) {
                        return $this->formatTask($task);
                    }),
            ],
        ];

        return response()->json($columns);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client' => 'nullable|string|max:255',
            'priority' => 'required|in:High,Medium,Low',
            'date' => 'required|date',
            'assignee_id' => 'required|exists:users,id',
            'status' => 'sometimes|in:ide_baru,review,sph,berjalan,selesai',
            'tags' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        // Jika client kosong, simpan sebagai 'N/A' supaya tetap konsisten di UI
        $validated['client'] = $validated['client'] ?? 'N/A';

        $task = MarketingTask::create($validated);
        
        // Log marketing task creation
        LogActivity::logMarketingTaskCreated($task->id, $task->title, $request->user()->id ?? null);

        return response()->json($task->load('assignee'), 201);
    }

    public function update(Request $request, $id)
    {
        $task = MarketingTask::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'client' => 'sometimes|string|max:255',
            'priority' => 'sometimes|in:High,Medium,Low',
            'date' => 'sometimes|date',
            'assignee_id' => 'sometimes|exists:users,id',
            'status' => 'sometimes|in:ide_baru,review,sph,berjalan,selesai',
            'tags' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        $task->update($validated);
        
        // Log marketing task update
        LogActivity::logMarketingTaskUpdated($task->id, $task->title, $request->user()->id ?? null);

        return response()->json($task->load('assignee'));
    }

    public function destroy($id)
    {
        $task = MarketingTask::find($id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }
        $taskTitle = $task->title;
        
        // Log marketing task deletion before deleting
        LogActivity::logMarketingTaskDeleted($task->id, $taskTitle, request()->user()->id ?? null);
        
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function move(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:ide_baru,review,sph,berjalan,selesai',
        ]);

        $task = MarketingTask::findOrFail($id);
        $oldStatus = $task->status;
        $task->update(['status' => $request->status]);
        
        // Log status change
        LogActivity::log(
            'Moved Marketing Task',
            'Marketing',
            $task->title,
            'Success',
            ['task_id' => $task->id, 'old_status' => $oldStatus, 'new_status' => $request->status],
            request()->user()->id ?? null
        );

        return response()->json($task->load('assignee'));
    }

    public function comments($id)
    {
        $task = MarketingTask::findOrFail($id);

        $comments = $task->comments()
            ->with('user')
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function addComment(Request $request, $id)
    {
        $task = MarketingTask::findOrFail($id);

        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $comment = MarketingTaskComment::create([
            'marketing_task_id' => $task->id,
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);

        LogActivity::log(
            'Commented on Marketing Task',
            'Marketing',
            $task->title,
            'Success',
            ['task_id' => $task->id, 'comment_id' => $comment->id],
            $request->user()->id
        );

        return response()->json($comment->load('user'), 201);
    }

    public function history($id)
    {
        $logs = ActivityLog::with('user')
            ->where('module', 'Marketing')
            ->where('metadata->task_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }

    public function attachments($id)
    {
        $task = MarketingTask::findOrFail($id);

        $attachments = $task->attachments()
            ->with('user')
            ->latest()
            ->get();

        return response()->json($attachments);
    }

    public function addAttachment(Request $request, $id)
    {
        $task = MarketingTask::findOrFail($id);

        $validated = $request->validate([
            'url' => 'required|url',
            'label' => 'nullable|string|max:255',
        ]);

        $attachment = MarketingTaskAttachment::create([
            'marketing_task_id' => $task->id,
            'user_id' => $request->user()->id,
            'label' => $validated['label'] ?? null,
            'url' => $validated['url'],
        ]);

        LogActivity::log(
            'Added Attachment to Marketing Task',
            'Marketing',
            $task->title,
            'Success',
            ['task_id' => $task->id, 'attachment_id' => $attachment->id],
            $request->user()->id
        );

        return response()->json($attachment->load('user'), 201);
    }

    public function deleteAttachment($taskId, $attachmentId)
    {
        $task = MarketingTask::findOrFail($taskId);

        $attachment = $task->attachments()->where('id', $attachmentId)->firstOrFail();
        $attachment->delete();

        LogActivity::log(
            'Deleted Attachment from Marketing Task',
            'Marketing',
            $task->title,
            'Success',
            ['task_id' => $task->id, 'attachment_id' => $attachmentId],
            request()->user()->id ?? null
        );

        return response()->json(['message' => 'Attachment deleted']);
    }

    private function formatTask($task)
    {
        $assignee = $task->assignee;
        $initials = $assignee ? strtoupper(substr($assignee->name, 0, 2)) : 'NA';

        return [
            'id' => $task->id,
            'title' => $task->title,
            'client' => $task->client,
            'priority' => $task->priority,
            'date' => $task->date->format('d M Y'),
            'assignee' => [
                'name' => $assignee->name ?? 'N/A',
                'initials' => $initials,
                'avatar' => $assignee->avatar ?? null,
            ],
            'description' => $task->description,
            'status' => $task->status,
            'tags' => $task->tags ?? [],
        ];
    }
}
