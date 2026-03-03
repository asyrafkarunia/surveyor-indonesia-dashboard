<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->with(['project', 'user']);

        // Filter by type
        if ($request->has('type') && $request->type !== 'Semua') {
            $typeMap = [
                'Belum Dibaca' => null, // Special case handled below
                'Komentar' => 'comment',
                'Update Proyek' => 'alert',
                'Assignment' => 'assignment',
                'Sistem' => 'system',
                'Finance' => 'finance',
            ];
            
            if ($request->type === 'Belum Dibaca') {
                $query->where('is_read', false);
            } else {
                $query->where('type', $typeMap[$request->type] ?? $request->type);
            }
        }

        // Filter by project
        if ($request->has('project_id') && $request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by date
        if ($request->has('date') && $request->date) {
            $query->whereDate('created_at', $request->date);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('project_name', 'like', "%{$search}%");
            });
        }

        $notifications = $query->latest()->paginate(20);

        return response()->json($notifications);
    }

    public function count(Request $request)
    {
        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $unreadCount]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['is_read' => true]);

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function deleteAll(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'All notifications deleted']);
    }

    public function destroy(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function getProjects(Request $request)
    {
        // Get projects that have notifications for this user
        $projectIds = Notification::where('user_id', $request->user()->id)
            ->whereNotNull('project_id')
            ->distinct()
            ->pluck('project_id');

        $projects = Project::whereIn('id', $projectIds)
            ->select('id', 'code', 'title')
            ->get();

        return response()->json($projects);
    }
}
