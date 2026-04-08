<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Models\Client;
use Illuminate\Support\Facades\DB;
use App\Models\Sph;
use App\Helpers\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class SphController extends Controller
{
    public function index(Request $request)
    {
        $query = Sph::with(['client', 'project', 'creator']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('sph_no', 'like', "%{$search}%")
                  ->orWhere('project_name', 'like', "%{$search}%")
                  ->orWhereHas('client', function($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $statuses = explode(',', $request->status);
            if (count($statuses) > 1) {
                $query->whereIn('status', $statuses);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->has('date')) {
            $query->whereDate('date_created', $request->date);
        }

        $sph = $query->latest()->paginate(15);

        return response()->json($sph);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'project_name' => 'required|string|max:255',
            'value' => 'required|numeric|min:0',
            'date_created' => 'required|date',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'validity_period' => 'nullable|date',
            'validity_months' => 'nullable|integer',
            'scope_of_work' => 'nullable|string',
            'time_period' => 'nullable|string',
            'term_payment' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_acc_no' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'is_new_application' => 'nullable|boolean',
        ]);

        $sph = DB::transaction(function () use ($validated, $request) {
            $year = date('Y');
            // Lock existing rows to prevent race condition on numbering
            $count = Sph::whereYear('created_at', $year)->lockForUpdate()->count() + 1;
            $validated['sph_no'] = 'SPH-' . str_pad($count, 3, '0', STR_PAD_LEFT) . '/PTSI/' . $year;
            $validated['status'] = 'waiting_head_section';
            $validated['created_by'] = $request->user()->id;
            $validated['is_new_application'] = $request->input('is_new_application', false);

            return Sph::create($validated);
        });
        
        // Log SPH creation
        LogActivity::logSphCreated($sph->id, $sph->sph_no, $request->user()->id);

        // Notify Head Section
        $headSections = User::where('role', 'head_section')->get();
        foreach ($headSections as $approver) {
            Notification::create([
                'user_id' => $approver->id,
                'project_id' => $sph->project_id,
                'type' => 'alert',
                'title' => 'Persetujuan SPH Dibutuhkan',
                'content' => "SPH Baru ({$sph->sph_no}) untuk proyek '{$sph->project_name}' membutuhkan persetujuan Anda.",
                'project_name' => $sph->project_name,
                'tag' => 'Approval',
                'is_read' => false,
                'data' => ['sph_id' => $sph->id, 'kind' => 'sph_needs_approval'],
            ]);
        }

        return response()->json($sph->load(['client', 'project', 'creator']), 201);
    }

    public function show($id)
    {
        $sph = Sph::with(['client', 'project', 'creator', 'approver'])->findOrFail($id);

        return response()->json($sph);
    }

    public function update(Request $request, $id)
    {
        $sph = Sph::findOrFail($id);

        $validated = $request->validate([
            'project_name' => 'sometimes|string|max:255',
            'value' => 'sometimes|numeric|min:0',
            'validity_period' => 'nullable|date',
            'validity_months' => 'nullable|integer',
            'scope_of_work' => 'nullable|string',
            'time_period' => 'nullable|string',
            'term_payment' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_acc_no' => 'nullable|string',
            'status' => 'sometimes|in:Draft,Sent,Approved,Rejected,waiting_head_section,waiting_senior_manager,waiting_general_manager,waiting_client,accepted,rejected',
        ]);

        $sph->update($validated);

        return response()->json($sph->load(['client', 'project', 'creator']));
    }

    public function destroy($id)
    {
        $sph = Sph::findOrFail($id);
        $sph->delete();

        return response()->json(['message' => 'SPH deleted successfully']);
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_name' => 'required|string|max:255',
            'value' => 'required|numeric',
            'date_created' => 'required|date',
            'description' => 'nullable|string',
            'items' => 'required|array',
            'validity_period' => 'nullable|date',
            'validity_months' => 'nullable|integer',
            'scope_of_work' => 'nullable|string',
            'time_period' => 'nullable|string',
            'term_payment' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_acc_no' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'is_new_application' => 'nullable|boolean',
        ]);

        $client = Client::find($validated['client_id']);
        
        // Create a temporary object for the view
        $sph = (object)[
            'sph_no' => 'SPH-PREVIEW/PTSI/' . date('Y'),
            'project_name' => $validated['project_name'],
            'value' => $validated['value'],
            'date_created' => Carbon::parse($validated['date_created']),
            'description' => $validated['description'],
            'items' => $validated['items'],
            'validity_period' => $validated['validity_period'] ? Carbon::parse($validated['validity_period']) : null,
            'validity_months' => $validated['validity_months'] ?? null,
            'validity_text' => $this->formatValidityMonths($validated['validity_months'] ?? null),
            'scope_of_work' => $validated['scope_of_work'] ?? null,
            'time_period' => $validated['time_period'] ?? null,
            'term_payment' => $validated['term_payment'] ?? null,
            'bank_name' => $validated['bank_name'] ?? 'Bank Mandiri cabang Pekanbaru',
            'bank_acc_no' => $validated['bank_acc_no'] ?? '108.000.21704.97',
            'terms_conditions' => $validated['terms_conditions'] ?? null,
            'is_new_application' => $validated['is_new_application'] ?? false,
            'client' => $client,
            'senior_manager_signature' => null,
            'general_manager_signature' => null,
        ];

        $coverFullPath = base_path('../public/logos/cover-sph.jpg');
        $coverPath = null;
        if (file_exists($coverFullPath)) {
            $type = pathinfo($coverFullPath, PATHINFO_EXTENSION);
            if (strtolower($type) === 'jpg') $type = 'jpeg';
            $data = file_get_contents($coverFullPath);
            $coverPath = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('sph.template', [
            'sph' => $sph,
            'client' => $client,
            'coverPath' => $coverPath,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function generate(Request $request, $id)
    {
        try {
            $sph = Sph::with(['client', 'project'])->findOrFail($id);

            $filePath = $this->generatePDF($sph);

            $sph->update([
                'status' => 'waiting_head_section',
            ]);

            return response()->json([
                'message' => 'SPH generated successfully',
                'file_path' => $filePath,
                'download_url' => asset('storage/' . $filePath),
            ]);
        } catch (\Exception $e) {
            Log::error('SPH Generate Error: ' . $e->getMessage(), [
                'sph_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Gagal membuat dokumen SPH. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }
    
    public function approve(Request $request, $id)
    {
        try {
            $sph = Sph::with(['client', 'project'])->findOrFail($id);
            $user = $request->user();

            // Determine if a signature is required based on status
            // If it's a new application (manual signature), backend shouldn't enforce digital signature uploads
            $needsSignature = ($sph->status === 'waiting_senior_manager' || $sph->status === 'waiting_general_manager') && !$sph->is_new_application;
            
            if ($needsSignature) {
                $request->validate([
                    'signature' => 'nullable|image|max:2048',
                    'use_existing_signature' => 'nullable|boolean'
                ]);
            }

            $isUpdated = false;
            $signaturePath = null;

            // Handle signature logic for managers
            if ($needsSignature) {
                if ($request->hasFile('signature')) {
                    $signaturePath = $request->file('signature')->store('signatures/users', 'public');
                    // Save to user profile for future use
                    $user->update(['signature' => $signaturePath]);
                } elseif ($request->boolean('use_existing_signature') && $user->signature) {
                    $signaturePath = $user->signature;
                } elseif ($request->hasFile('signature') === false && !$user->signature) {
                    return response()->json(['message' => 'Signature is required for this approval stage'], 422);
                }
            }

            if ($sph->status === 'waiting_head_section' && ($user->role === 'head_section' || $user->role_name === 'Head Section' || $user->role === 'approver')) {
                $sph->status = 'waiting_senior_manager';
                $isUpdated = true;
            } elseif ($sph->status === 'waiting_senior_manager' && ($user->role === 'senior_manager' || $user->role_name === 'Senior Manager' || $user->role === 'approver')) {
                $sph->status = 'waiting_general_manager';
                if ($signaturePath) {
                    $sph->senior_manager_signature = $signaturePath;
                }
                $isUpdated = true;
            } elseif ($sph->status === 'waiting_general_manager' && ($user->role === 'general_manager' || $user->role_name === 'General Manager' || $user->role === 'approver')) {
                $sph->status = 'waiting_client';
                if ($signaturePath) {
                    $sph->general_manager_signature = $signaturePath;
                }
                $sph->approved_by = $user->id;
                $sph->approved_at = now();
                $isUpdated = true;
            }

            if ($isUpdated) {
                $sph->save();
                // Re-generate PDF with new signatures
                $this->generatePDF($sph);

                // Notify next stage or final approval
                if ($sph->status === 'waiting_senior_manager') {
                    $targetUsers = User::where('role', 'senior_manager')->get();
                    $title = 'Persetujuan SPH (Senior Manager)';
                } elseif ($sph->status === 'waiting_general_manager') {
                    $targetUsers = User::where('role', 'general_manager')->get();
                    $title = 'Persetujuan SPH (General Manager)';
                } elseif ($sph->status === 'waiting_client') {
                    $targetUsers = collect([$sph->creator]);
                    $title = 'SPH Disetujui Internal';
                }

                if (isset($targetUsers)) {
                    foreach ($targetUsers as $target) {
                        if (!$target) continue;
                        Notification::create([
                            'user_id' => $target->id,
                            'project_id' => $sph->project_id,
                            'type' => $sph->status === 'waiting_client' ? 'system' : 'alert',
                            'title' => $title,
                            'content' => $sph->status === 'waiting_client' 
                                ? "SPH ({$sph->sph_no}) telah disetujui secara internal dan siap dikirim ke klien."
                                : "SPH ({$sph->sph_no}) membutuhkan persetujuan Anda.",
                            'project_name' => $sph->project_name,
                            'tag' => $sph->status === 'waiting_client' ? 'System' : 'Approval',
                            'is_read' => false,
                            'data' => ['sph_id' => $sph->id, 'kind' => $sph->status === 'waiting_client' ? 'sph_approved_internal' : 'sph_needs_approval'],
                        ]);
                    }
                }

                return response()->json($sph->load(['client', 'project', 'creator']));
            }

            return response()->json(['message' => 'Unauthorized or invalid status sequence'], 403);
        } catch (\Exception $e) {
            Log::error('SPH Approval Error: ' . $e->getMessage(), [
                'id' => $id,
                'user' => $request->user()->id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Gagal menyetujui dokumen. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }

    public function clientDecision(Request $request, $id)
    {
        $sph = Sph::findOrFail($id);
        $request->validate(['decision' => 'required|in:accepted,rejected']);

        if ($sph->status !== 'waiting_client') {
             return response()->json(['message' => 'Invalid status for client decision'], 400);
        }

        if ($request->decision === 'accepted') {
            $sph->update([
                'status' => 'accepted',
                'approved_at' => now(),
            ]);
            // Auto-generate PDF upon approval
            $this->generatePDF($sph);
        } else {
            $sph->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);
        }

        // Notify creator about client decision
        if ($sph->creator) {
            Notification::create([
                'user_id' => $sph->creator->id,
                'project_id' => $sph->project_id,
                'type' => $request->decision === 'accepted' ? 'system' : 'alert',
                'title' => $request->decision === 'accepted' ? 'SPH Diterima Klien' : 'SPH Ditolak Klien',
                'content' => "Klien telah " . ($request->decision === 'accepted' ? "MENERIMA" : "MENOLAK") . " SPH ({$sph->sph_no}).",
                'project_name' => $sph->project_name,
                'tag' => 'Client Decision',
                'is_read' => false,
                'data' => ['sph_id' => $sph->id],
            ]);
        }
        
        return response()->json($sph);
    }

    public function reject(Request $request, $id)
    {
        $sph = Sph::findOrFail($id);
        
        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $sph->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'rejected_by' => $request->user()->id,
            'rejected_at' => now(),
        ]);

        // Notify creator about rejection
        if ($sph->creator) {
            Notification::create([
                'user_id' => $sph->creator->id,
                'project_id' => $sph->project_id,
                'type' => 'alert',
                'title' => 'SPH Ditolak Internal',
                'content' => "SPH ({$sph->sph_no}) telah DITOLAK. Alasan: " . substr($request->rejection_reason, 0, 100),
                'project_name' => $sph->project_name,
                'tag' => 'Rejection',
                'is_read' => false,
                'data' => ['sph_id' => $sph->id, 'kind' => 'sph_rejected'],
            ]);
        }

        return response()->json($sph);
    }

    private function generatePDF($sph)
    {
        try {
            $sph->load(['client', 'project', 'creator']);

            // Prepare base64 encoded paths for signatures
            $smSignaturePath = null;
            if ($sph->senior_manager_signature && Storage::disk('public')->exists($sph->senior_manager_signature)) {
                $path = storage_path('app/public/' . $sph->senior_manager_signature);
                if (file_exists($path)) {
                    $type = pathinfo($path, PATHINFO_EXTENSION);
                    if (strtolower($type) === 'jpg') $type = 'jpeg';
                    $data = file_get_contents($path);
                    $smSignaturePath = 'data:image/' . $type . ';base64,' . base64_encode($data);
                }
            }

            $gmSignaturePath = null;
            if ($sph->general_manager_signature && Storage::disk('public')->exists($sph->general_manager_signature)) {
                $path = storage_path('app/public/' . $sph->general_manager_signature);
                if (file_exists($path)) {
                    $type = pathinfo($path, PATHINFO_EXTENSION);
                    if (strtolower($type) === 'jpg') $type = 'jpeg';
                    $data = file_get_contents($path);
                    $gmSignaturePath = 'data:image/' . $type . ';base64,' . base64_encode($data);
                }
            }

            // Generate PDF using template
            $coverFullPath = base_path('../public/logos/cover-sph.jpg');
            $coverPath = null;
            if (file_exists($coverFullPath)) {
                $type = pathinfo($coverFullPath, PATHINFO_EXTENSION);
                if (strtolower($type) === 'jpg') $type = 'jpeg';
                $data = file_get_contents($coverFullPath);
                $coverPath = 'data:image/' . $type . ';base64,' . base64_encode($data);
            }

            $sph->validity_text = $this->formatValidityMonths($sph->validity_months);

            $pdf = Pdf::loadView('sph.template', [
                'sph' => $sph,
                'client' => $sph->client,
                'smSignaturePath' => $smSignaturePath,
                'gmSignaturePath' => $gmSignaturePath,
                'coverPath' => $coverPath,
            ]);

            $fileName = 'SPH-' . str_replace('/', '-', $sph->sph_no) . '.pdf';
            $filePath = 'sph/' . $fileName;
            
            // Save to storage
            Storage::disk('public')->put($filePath, $pdf->output());

            $sph->update([
                'generated_file_path' => $filePath,
            ]);
            
            return $filePath;
        } catch (\Exception $e) {
            Log::error('SPH PDF Generation Error: ' . $e->getMessage(), [
                'sph_id' => $sph->id,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function formatValidityMonths($months)
    {
        if (!$months) return "-";
        
        $numberToWord = [
            1 => 'one', 2 => 'two', 3 => 'three', 4 => 'four', 5 => 'five',
            6 => 'six', 7 => 'seven', 8 => 'eight', 9 => 'nine', 10 => 'ten',
            11 => 'eleven', 12 => 'twelve'
        ];
        
        $word = $numberToWord[(int)$months] ?? $months;
        $unit = (int)$months > 1 ? 'months' : 'month';
        
        return "{$months} ({$word}) {$unit} after quotation issued";
    }
}