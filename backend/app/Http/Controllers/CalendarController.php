<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function events(Request $request)
    {
        $query = CalendarEvent::with(['user', 'project']);

        if ($request->has('start') && $request->has('end')) {
            $query->where(function($q) use ($request) {
                $q->whereBetween('date', [$request->start, $request->end])
                  ->orWhere(function($q2) use ($request) {
                      $q2->where('end_date', '>=', $request->start)
                         ->where('date', '<=', $request->end);
                  });
            });
        } elseif ($request->has('month') && $request->has('year')) {
            $startDate = sprintf('%04d-%02d-01', $request->year, $request->month);
            $endDate = date('Y-m-t', strtotime($startDate));
            $query->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate])
                  ->orWhere(function($q2) use ($startDate, $endDate) {
                      $q2->where('end_date', '>=', $startDate)
                         ->where('date', '<=', $endDate);
                  });
            });
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $events = $query->get();

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'duration_days' => 'sometimes|integer|min:1|max:365',
            'end_date' => 'nullable|date|after_or_equal:date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'project_id' => 'nullable|exists:projects,id',
            'type' => 'sometimes|in:meeting,deadline,activity,other',
            'color' => 'sometimes|string',
            'is_recurring' => 'sometimes|boolean',
            'recurring_frequency' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurring_interval' => 'nullable|integer|min:1',
            'recurring_end_type' => 'nullable|in:never,date,count',
            'recurring_end_date' => 'nullable|date|after:date',
            'recurring_count' => 'nullable|integer|min:1',
        ]);

        $validated['user_id'] = $request->user()->id;
        
        // Calculate end_date if duration_days is provided
        if (isset($validated['duration_days']) && !isset($validated['end_date'])) {
            $startDate = \Carbon\Carbon::parse($validated['date']);
            $validated['end_date'] = $startDate->copy()->addDays($validated['duration_days'] - 1)->format('Y-m-d');
        }

        $event = CalendarEvent::create($validated);

        // Auto-create feed activity for meetings
        if ($event->type === 'meeting') {
            $timeString = $event->start_time ? " Pukul " . substr($event->start_time, 0, 5) : "";
            \App\Models\Activity::create([
                'type' => 'meeting',
                'content' => "Rapat Terjadwal: {$event->title}\nTanggal: " . \Carbon\Carbon::parse($event->date)->translatedFormat('l, d F Y') . $timeString,
                'user_id' => $request->user()->id,
                'project_id' => $event->project_id,
            ]);
        }

        return response()->json($event->load(['user', 'project']), 201);
    }

    public function update(Request $request, $id)
    {
        $event = CalendarEvent::findOrFail($id);

        // Only allow creator to update
        if ($event->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date' => 'sometimes|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'type' => 'sometimes|in:meeting,deadline,activity,other',
        ]);

        $event->update($validated);

        return response()->json($event->load(['user', 'project']));
    }

    public function destroy($id, Request $request)
    {
        $event = CalendarEvent::findOrFail($id);

        // Only allow creator to delete
        if ($event->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}
