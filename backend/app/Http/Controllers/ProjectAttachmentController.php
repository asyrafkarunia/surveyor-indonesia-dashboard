<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectAttachmentController extends Controller
{
    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => 'required|file|max:10240',
            ]);

            $file = $request->file('file');
            $path = $file->store('project-attachments', 'public');

            $attachment = ProjectAttachment::create([
                'project_id' => $project->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => $request->user()->id,
            ]);

            return response()->json($attachment->load('uploader'), 201);
        }

        $validated = $request->validate([
            'url' => 'required|url',
            'label' => 'nullable|string|max:255',
        ]);

        $attachment = ProjectAttachment::create([
            'project_id' => $project->id,
            'file_name' => $validated['label'] ?? $validated['url'],
            'file_path' => $validated['url'],
            'file_type' => 'link',
            'file_size' => 0,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($attachment->load('uploader'), 201);
    }

    public function destroy($projectId, $attachmentId)
    {
        $attachment = ProjectAttachment::findOrFail($attachmentId);

        if ($attachment->uploaded_by !== auth()->id() &&
            $attachment->project->pic_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($attachment->file_type !== 'link' && $attachment->file_path) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully']);
    }

    public function download($projectId, $attachmentId)
    {
        $attachment = ProjectAttachment::findOrFail($attachmentId);

        if (!$attachment->file_path || !Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $fullPath = storage_path('app/public/' . ltrim($attachment->file_path, '/'));

        return response()->download($fullPath, $attachment->file_name);
    }
}
