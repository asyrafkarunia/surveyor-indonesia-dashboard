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
                  ->orWhere('project_name', 'like', "%{$search}%");
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

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date_created', [$request->start_date, $request->end_date]);
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
            'validity_period' => 'required|date',
            'terms_conditions' => 'nullable|string',
        ]);

        $sph = DB::transaction(function () use ($validated, $request) {
            $year = date('Y');
            // Lock existing rows to prevent race condition on numbering
            $count = Sph::whereYear('created_at', $year)->lockForUpdate()->count() + 1;
            $validated['sph_no'] = 'SPH-' . str_pad($count, 3, '0', STR_PAD_LEFT) . '/PTSI/' . $year;
            $validated['status'] = 'waiting_head_section';
            $validated['created_by'] = $request->user()->id;

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
            'date_created' => 'sometimes|date',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
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
            'validity_period' => 'required|date',
            'time_period' => 'nullable|string',
            'term_payment' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_acc_no' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
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
            'validity_period' => Carbon::parse($validated['validity_period']),
            'time_period' => $validated['time_period'] ?? null,
            'term_payment' => $validated['term_payment'] ?? null,
            'bank_name' => $validated['bank_name'] ?? 'PT Surveyor Indonesia',
            'bank_acc_no' => $validated['bank_acc_no'] ?? '108.000.21704.97',
            'terms_conditions' => $validated['terms_conditions'],
            'client' => $client,
            'senior_manager_signature' => null,
            'general_manager_signature' => null,
        ];

        $idSurveyLogoPath = null;
        $ptsiLogoPath = null;
        if (Storage::disk('public')->exists('assets/logo-idsurvey.png')) {
            $idSurveyLogoPath = storage_path('app/public/assets/logo-idsurvey.png');
        }
        if (Storage::disk('public')->exists('assets/logo-ptsi.png')) {
            $ptsiLogoPath = storage_path('app/public/assets/logo-ptsi.png');
        }

        $pdf = Pdf::loadView('sph.template', [
            'sph' => $sph,
            'client' => $client,
            'idSurveyLogoPath' => $idSurveyLogoPath,
            'ptsiLogoPath' => $ptsiLogoPath,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Access-Control-Allow-Origin' => $request->headers->get('origin') ?? '*',
            'Access-Control-Allow-Credentials' => 'true',
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
            $needsSignature = ($sph->status === 'waiting_senior_manager' || $sph->status === 'waiting_general_manager');
            
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

            // Prepare absolute paths for signatures using storage_path
            $smSignaturePath = null;
            if ($sph->senior_manager_signature && Storage::disk('public')->exists($sph->senior_manager_signature)) {
                $smSignaturePath = storage_path('app/public/' . $sph->senior_manager_signature);
            }

            $gmSignaturePath = null;
            if ($sph->general_manager_signature && Storage::disk('public')->exists($sph->general_manager_signature)) {
                $gmSignaturePath = storage_path('app/public/' . $sph->general_manager_signature);
            }

            // Generate PDF using template
            $idSurveyLogoPath = null;
            $ptsiLogoPath = null;
            if (Storage::disk('public')->exists('assets/logo-idsurvey.png')) {
                $idSurveyLogoPath = storage_path('app/public/assets/logo-idsurvey.png');
            }
            if (Storage::disk('public')->exists('assets/logo-ptsi.png')) {
                $ptsiLogoPath = storage_path('app/public/assets/logo-ptsi.png');
            }

            $pdf = Pdf::loadView('sph.template', [
                'sph' => $sph,
                'client' => $sph->client,
                'smSignaturePath' => $smSignaturePath,
                'gmSignaturePath' => $gmSignaturePath,
                'idSurveyLogoPath' => $idSurveyLogoPath,
                'ptsiLogoPath' => $ptsiLogoPath,
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
}