<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Activity;
use App\Models\ActivityAttachment;
use App\Models\ActivityLike;
use App\Models\ActivityComment;
use App\Models\User;
use App\Models\CalendarEvent;
use App\Models\AudiensiLetter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with(['user', 'project', 'likes.user', 'comments.user', 'attachments', 'mentionedUsers']);

        // Privasi Feed: Aktivitas selain "post" hanya dapat dilihat oleh pembuat atau orang yang di-tag
        $user = $request->user();
        if ($user) {
            $query->where(function($q) use ($user) {
                $q->where('type', 'post')
                  ->orWhere('user_id', $user->id)
                  ->orWhereHas('mentionedUsers', function($q2) use ($user) {
                      $q2->where('users.id', $user->id);
                  });
            });
        }

        if ($request->has('type') && $request->type !== 'Semua') {
            $query->where('type', $request->type);
        }

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        $activities = $query->latest()->paginate(20);

        // Add like and comment counts
        /** @var \Illuminate\Pagination\LengthAwarePaginator $activities */
        $activities->through(function ($activity) use ($request) {
            $activity->likes_count = $activity->likes->count();
            $activity->comments_count = $activity->comments->count();
            $activity->is_liked = $request->user() 
                ? $activity->likes->where('user_id', $request->user()->id)->isNotEmpty()
                : false;
            return $activity;
        });

        return response()->json($activities);
    }

    public function store(Request $request)
    {
        // Decode mentions/tags if sent as JSON strings via FormData
        foreach (['mentions', 'tags'] as $arrKey) {
            if ($request->has($arrKey) && is_string($request->$arrKey)) {
                $decoded = json_decode($request->$arrKey, true);
                if (is_array($decoded)) {
                    $request->merge([$arrKey => $decoded]);
                }
            }
        }

        $validated = $request->validate([
            'type' => 'required|in:project_update,alert,meeting,post',
            'title' => 'nullable|string|max:255',
            'content' => 'required|string',
            'project_id' => 'nullable|exists:projects,id',
            'tags' => 'nullable|array',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
            'is_urgent' => 'sometimes|boolean',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // Max 10MB per file
        ]);

        $validated['user_id'] = $request->user()->id;

        // Parse mentions from content (@username format)
        if ($request->has('content')) {
            $content = $request->content;
            preg_match_all('/@(\w+)/', $content, $matches);
            if (!empty($matches[1])) {
                $mentionedUsers = User::whereIn('name', $matches[1])
                    ->orWhereIn('email', $matches[1])
                    ->pluck('id')
                    ->toArray();
                if (!empty($mentionedUsers)) {
                    $validated['mentions'] = array_unique(array_merge($validated['mentions'] ?? [], $mentionedUsers));
                }
            }
        }

        $activity = Activity::create($validated);

        // Handle multiple file uploads
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('activities', 'public');
                
                ActivityAttachment::create([
                    'activity_id' => $activity->id,
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        // Sync mentions if provided
        if (!empty($validated['mentions'])) {
            $activity->mentionedUsers()->sync($validated['mentions']);
            
            // Create notifications for mentioned users
            foreach ($validated['mentions'] as $userId) {
                Notification::create([
                    'user_id' => $userId,
                    'type' => 'comment',
                    'title' => 'Anda disebutkan dalam aktivitas',
                    'content' => $request->user()->name . ' menyebutkan Anda dalam aktivitas: ' . substr($validated['content'], 0, 100),
                    'project_id' => $validated['project_id'] ?? null,
                    'project_name' => $activity->project?->title ?? null,
                    'data' => ['activity_id' => $activity->id],
                ]);
            }
        }

        return response()->json($activity->load(['user', 'project', 'attachments', 'mentionedUsers']), 201);
    }

    public function show($id)
    {
        $activity = Activity::with(['user', 'project', 'likes.user', 'comments.user', 'attachments', 'mentionedUsers'])
            ->findOrFail($id);

        return response()->json($activity);
    }

    public function update(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        // Only allow creator to update
        if ($activity->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'tags' => 'nullable|array',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
            'is_urgent' => 'sometimes|boolean',
        ]);

        $activity->update($validated);

        return response()->json($activity->load(['user', 'project', 'attachments']));
    }

    public function destroy(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        // Only allow creator to delete
        if ($activity->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $activity->delete();

        return response()->json(['message' => 'Activity deleted successfully']);
    }

    public function like(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);
        $user = $request->user();

        $like = \App\Models\ActivityLike::where('activity_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            \App\Models\ActivityLike::create([
                'activity_id' => $id,
                'user_id' => $user->id,
            ]);
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'likes_count' => $activity->likes()->count(),
        ]);
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'comment' => 'required|string',
        ]);

        $comment = \App\Models\ActivityComment::create([
            'activity_id' => $id,
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function offline(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update(['is_online' => false]);
        }
        return response()->json(['message' => 'User offline']);
    }

    public function getOnlineUsers(Request $request)
    {
        // Get users who were active in the last 5 minutes AND are marked as online
        $fiveMinutesAgo = Carbon::now()->subMinutes(5);
        
        $onlineUsers = User::where('last_activity_at', '>=', $fiveMinutesAgo)
            ->where('is_online', true)
            ->select('id', 'name', 'email', 'avatar', 'is_online', 'last_activity_at')
            ->get();

        return response()->json($onlineUsers);
    }

    public function getUpcomingDeadlines(Request $request)
    {
        $now = Carbon::now();
        $sevenDaysLater = Carbon::now()->addDays(7);

        // Filter: Type in ['meeting', 'deadline'] and Date between Now and +7 Days
        $activities = CalendarEvent::whereIn('type', ['meeting', 'deadline'])
            ->whereBetween('date', [$now->toDateString(), $sevenDaysLater->toDateString()])
            ->with(['user', 'project'])
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'type' => $event->type,
                    'date' => $event->date,
                    'month' => Carbon::parse($event->date)->format('M'),
                    'day' => Carbon::parse($event->date)->format('d'),
                    'time' => $event->start_time ? Carbon::parse($event->start_time)->format('H:i') : null,
                    'team' => $event->user->name ?? 'N/A',
                    'project' => $event->project->title ?? null,
                ];
            });

        // Add Audiensi Letters as meetings (implicitly 'meeting')
        // Only if date is within range
        $audiensi = AudiensiLetter::whereBetween('date', [$now->toDateString(), $sevenDaysLater->toDateString()])
            ->with(['client', 'creator'])
            ->get()
            ->map(function ($letter) {
                return [
                    'id' => 'aud-' . $letter->id,
                    'title' => 'Audiensi: ' . $letter->company_name,
                    'type' => 'meeting',
                    'date' => $letter->date->format('Y-m-d'),
                    'month' => $letter->date->format('M'),
                    'day' => $letter->date->format('d'),
                    'time' => null,
                    'team' => $letter->creator->name ?? 'Marketing',
                    'project' => $letter->purpose,
                ];
            });

        $allActivities = $activities->concat($audiensi)->sortBy('date')->values();

        return response()->json($allActivities);
    }

    public function getUsers(Request $request)
    {
        // Get all users for mention autocomplete
        $users = User::select('id', 'name', 'email', 'avatar')
            ->get();

        return response()->json($users);
    }
}
