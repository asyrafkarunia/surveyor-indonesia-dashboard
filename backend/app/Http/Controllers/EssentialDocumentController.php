<?php

namespace App\Http\Controllers;

use App\Models\EssentialDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class EssentialDocumentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $page = $request->get('page', 1);
        $cacheKey = 'essential_documents_' . md5($search . '_' . $page);

        return Cache::remember($cacheKey, 60, function () use ($search) {
            $query = EssentialDocument::with('uploader')->orderByDesc('created_at');

            if ($search) {
                $query->where('title', 'like', '%' . $search . '%');
            }

            return $query->paginate(15);
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        $file = $validated['file'];
        $path = $file->store('essential-documents', 'public');

        $document = EssentialDocument::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'uploaded_by' => Auth::id(),
        ]);

        return $document->load('uploader');
    }

    public function download($id)
    {
        $document = EssentialDocument::findOrFail($id);

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $fullPath = storage_path('app/public/' . ltrim($document->file_path, '/'));

        return response()->download($fullPath, $document->file_name);
    }

    public function destroy($id)
    {
        $document = EssentialDocument::findOrFail($id);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Deleted']);
    }
}