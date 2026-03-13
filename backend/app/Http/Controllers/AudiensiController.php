<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use App\Models\AudiensiLetter;
use App\Models\AudiensiTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class AudiensiController extends Controller
{
    public function index(Request $request)
    {
        $query = AudiensiLetter::with(['client', 'template', 'creator']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('letter_number', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
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

        $letters = $query->latest()->paginate(15);

        return response()->json($letters);
    }

    public function stats()
    {
        $total = AudiensiLetter::count();
        $upcoming = AudiensiLetter::whereNotIn('status', ['accepted', 'rejected'])->count();
        $completed = AudiensiLetter::where('status', 'accepted')->count();
        $rejected = AudiensiLetter::where('status', 'rejected')->count();

        return response()->json([
            'total_sent' => $total,
            'upcoming' => $upcoming,
            'completed' => $completed,
            'rejected' => $rejected,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'company_name' => 'required|string|max:255',
            'sector' => 'required|string',
            'purpose' => 'required|string',
            'position' => 'required|string',
            'template_id' => 'nullable|exists:audiensi_templates,id',
            'content' => 'nullable|string',
            'date' => 'required|date',
            'is_new_application' => 'nullable|boolean',
        ]);

        $letter = DB::transaction(function () use ($validated, $request) {
            $year = date('Y');
            $month = date('n');
            // Lock existing rows to prevent race condition on numbering
            $count = AudiensiLetter::whereYear('created_at', $year)->whereMonth('created_at', $month)->lockForUpdate()->count() + 1;
            $validated['letter_number'] = 'AUD/SI/' . $year . '/' . $month . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);
            $validated['created_by'] = $request->user()->id;
            $validated['status'] = $request->boolean('is_new_application') ? 'waiting_client' : 'waiting_head_section';

            return AudiensiLetter::create($validated);
        });

        return response()->json($letter->load(['client', 'template', 'creator']), 201);
    }

    public function show($id)
    {
        $letter = AudiensiLetter::with(['client', 'template', 'creator'])->findOrFail($id);

        return response()->json($letter);
    }

    public function update(Request $request, $id)
    {
        $letter = AudiensiLetter::findOrFail($id);

        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'sector' => 'sometimes|string',
            'purpose' => 'sometimes|string',
            'position' => 'sometimes|string',
            'content' => 'nullable|string',
            'date' => 'sometimes|date',
        ]);

        $letter->update($validated);

        return response()->json($letter->load(['client', 'template', 'creator']));
    }

    public function destroy($id)
    {
        $letter = AudiensiLetter::findOrFail($id);
        $letter->delete();

        return response()->json(['message' => 'Audiensi letter deleted successfully']);
    }

    public function generate(Request $request, $id)
    {
        try {
            $letter = AudiensiLetter::findOrFail($id);
            $filePath = $this->generatePDF($letter);

            return response()->json([
                'message' => 'Audiensi letter generated successfully',
                'file_path' => $filePath,
                'download_url' => asset('storage/' . $filePath),
            ]);
        } catch (\Exception $e) {
            Log::error('Audiensi Generate Error: ' . $e->getMessage(), [
                'letter_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Gagal membuat PDF. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        try {
            $letter = AudiensiLetter::findOrFail($id);
            $user = $request->user();

            // Determine if a signature is required based on status and role
            $needsSignature = ($letter->status === 'waiting_senior_manager' || $letter->status === 'waiting_general_manager');
            
            if ($needsSignature) {
                try {
                    $request->validate([
                        'signature' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                        'use_existing_signature' => 'nullable|boolean'
                    ]);
                } catch (\Illuminate\Validation\ValidationException $ve) {
                    return response()->json([
                        'message' => 'Validasi tanda tangan gagal',
                        'errors' => $ve->errors()
                    ], 422);
                }
            }

            $isUpdated = false;
            $signaturePath = null;

            // Handle signature logic for managers
            if ($needsSignature) {
                if ($request->hasFile('signature')) {
                    $signaturePath = $request->file('signature')->store('signatures/users', 'public');
                    if (!$signaturePath) {
                        throw new \Exception('Gagal menyimpan file tanda tangan ke storage');
                    }
                    // Save to user profile for future use
                    $user->update(['signature' => $signaturePath]);
                } elseif ($request->boolean('use_existing_signature')) {
                    if (!$user->signature) {
                        return response()->json(['message' => 'Anda belum memiliki tanda tangan tersimpan'], 422);
                    }
                    $signaturePath = $user->signature;
                } else {
                    return response()->json(['message' => 'Tanda tangan diperlukan untuk tahap ini'], 422);
                }
            }

            // Status transition logic with specific error messages
            if ($letter->status === 'waiting_head_section') {
                if ($user->role === 'head_section' || $user->role_name === 'Head Section' || $user->role === 'approver') {
                    $letter->status = 'waiting_senior_manager';
                    $isUpdated = true;
                } else {
                    return response()->json(['message' => 'Hanya Head Section yang dapat menyetujui tahap ini'], 403);
                }
            } elseif ($letter->status === 'waiting_senior_manager') {
                if ($user->role === 'senior_manager' || $user->role_name === 'Senior Manager' || $user->role === 'approver') {
                    $letter->status = 'waiting_general_manager';
                    if ($signaturePath) {
                        $letter->senior_manager_signature = $signaturePath;
                    }
                    $isUpdated = true;
                } else {
                    return response()->json(['message' => 'Hanya Senior Manager yang dapat menyetujui tahap ini'], 403);
                }
            } elseif ($letter->status === 'waiting_general_manager') {
                if ($user->role === 'general_manager' || $user->role_name === 'General Manager' || $user->role === 'approver') {
                    $letter->status = 'waiting_client';
                    if ($signaturePath) {
                        $letter->general_manager_signature = $signaturePath;
                    }
                    $letter->approved_by = $user->id;
                    $letter->approved_at = now();
                    $isUpdated = true;
                } else {
                    return response()->json(['message' => 'Hanya General Manager yang dapat menyetujui tahap ini'], 403);
                }
            }

            if ($isUpdated) {
                if (!$letter->save()) {
                    throw new \Exception('Gagal menyimpan perubahan status ke database');
                }
                
                // Re-generate PDF with new signatures
                try {
                    $this->generatePDF($letter);
                } catch (\Exception $pdfException) {
                    Log::error('PDF Regeneration failed during approval', [
                        'letter_id' => $id,
                        'error' => $pdfException->getMessage()
                    ]);
                    // Approval succeeded but PDF generation failed — inform user without leaking error detail
                    return response()->json([
                        'message' => 'Persetujuan berhasil, namun gagal memperbarui file PDF. Silakan generate ulang.',
                        'data' => $letter->fresh(['client', 'template', 'creator']),
                    ], 200); 
                }
                
                return response()->json($letter->fresh(['client', 'template', 'creator']));
            }

            return response()->json(['message' => 'Urutan status tidak valid atau Anda tidak memiliki akses'], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Dokumen tidak ditemukan'], 404);
        } catch (\Exception $e) {
            Log::error('Audiensi Approval Critical Error: ' . $e->getMessage(), [
                'id' => $id,
                'user' => $request->user()->id,
                'status' => $letter->status ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Gagal menyetujui dokumen. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        }
    }

    private function generatePDF($letter)
    {
        try {
            $letter->load(['client', 'template', 'creator']);

            // Ensure we have carbon objects for dates
            $letterDate = $letter->date instanceof Carbon ? $letter->date : Carbon::parse($letter->date);

            if ($letter->template && $letter->template->template_content) {
                // Generate PDF from dynamic template content
                $content = $letter->template->template_content;
                $placeholders = [
                    '[NOMOR_SURAT]' => $letter->letter_number,
                    '[NAMA_PERUSAHAAN]' => $letter->company_name,
                    '{{NamaPerusahaan}}' => $letter->company_name,
                    '[ALAMAT_PERUSAHAAN]' => optional($letter->client)->address ?? '',
                    '[TANGGAL]' => $letterDate->isoFormat('D MMMM Y'),
                    '{{TanggalSurat}}' => $letterDate->isoFormat('D MMMM Y'),
                    '[TUJUAN]' => $letter->purpose,
                    '{{NamaPimpinan}}' => $letter->purpose,
                    '{{Jabatan}}' => $letter->position,
                    '[KONTEN_TAMBAHAN]' => $letter->content ?? '',
                    '{{NamaPengirim}}' => optional($letter->creator)->name ?? 'Admin',
                ];

                // Add signatures if approved or in progress
                $signatureHtml = '';
                if (in_array($letter->status, ['waiting_senior_manager', 'waiting_general_manager', 'waiting_client', 'accepted'])) {
                    $smSignature = '';
                    if ($letter->senior_manager_signature && Storage::disk('public')->exists($letter->senior_manager_signature)) {
                        $smPath = storage_path('app/public/' . $letter->senior_manager_signature);
                        if (file_exists($smPath)) {
                            $smSignature = '<img src="' . $smPath . '" style="height: 60px; max-width: 150px; display: block; margin-bottom: 5px;">';
                        }
                    } 
                    
                    if (empty($smSignature)) {
                        $smSignature = '<div style="height: 65px;"></div>';
                    }

                    $gmSignature = '';
                    if ($letter->general_manager_signature && Storage::disk('public')->exists($letter->general_manager_signature)) {
                        $gmPath = storage_path('app/public/' . $letter->general_manager_signature);
                        if (file_exists($gmPath)) {
                            $gmSignature = '<img src="' . $gmPath . '" style="height: 60px; max-width: 150px; display: block; margin-bottom: 5px;">';
                        }
                    }
                    
                    if (empty($gmSignature)) {
                        $gmSignature = '<div style="height: 65px;"></div>';
                    }

                    $hasSmImage = strpos($smSignature, '<img') !== false;
                    $hasGmImage = strpos($gmSignature, '<img') !== false;
                    $showElectronicNote = ($hasSmImage || $hasGmImage) || !empty($letter->approved_by);
                    $noteHtml = $showElectronicNote 
                        ? '<div style="font-size: 10px; color: #666; margin-top: 15px;"><i>Dokumen ini telah ditandatangani secara elektronik.</i></div>'
                        : '';

                    $signatureHtml = '<div style="margin-top: 30px; width: 100%;">
                        <p>Hormat kami,</p>
                        <p><strong>PT Surveyor Indonesia</strong></p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <tr>
                                <td style="width: 50%; vertical-align: bottom;">
                                    ' . $smSignature . '
                                    <p style="margin: 0;"><u>( Senior Manager )</u></p>
                                    <p style="margin: 0; font-size: 11px;">Senior Manager</p>
                                </td>
                                <td style="width: 50%; vertical-align: bottom;">
                                    ' . $gmSignature . '
                                    <p style="margin: 0;"><u>( General Manager )</u></p>
                                    <p style="margin: 0; font-size: 11px;">General Manager</p>
                                </td>
                            </tr>
                        </table>
                        ' . $noteHtml . '
                    </div>';
                    
                    if (strpos($content, '[TANDA_TANGAN]') !== false) {
                        $placeholders['[TANDA_TANGAN]'] = $signatureHtml;
                    } else {
                        $content .= $signatureHtml;
                    }
                }

                foreach ($placeholders as $key => $value) {
                    $content = str_replace($key, $value, $content);
                }

                $pdf = Pdf::loadHTML($content);
            } else {
                // Prepare absolute paths for signatures in static template using storage_path
                $smSignaturePath = null;
                if ($letter->senior_manager_signature && Storage::disk('public')->exists($letter->senior_manager_signature)) {
                    $smPath = storage_path('app/public/' . $letter->senior_manager_signature);
                    if (file_exists($smPath)) {
                        $smSignaturePath = $smPath;
                    }
                }

                $gmSignaturePath = null;
                if ($letter->general_manager_signature && Storage::disk('public')->exists($letter->general_manager_signature)) {
                    $gmPath = storage_path('app/public/' . $letter->general_manager_signature);
                    if (file_exists($gmPath)) {
                        $gmSignaturePath = $gmPath;
                    }
                }

                // Fallback to static view
                $pdf = Pdf::loadView('audiensi.template', [
                    'letter' => $letter,
                    'client' => $letter->client,
                    'smSignaturePath' => $smSignaturePath,
                    'gmSignaturePath' => $gmSignaturePath,
                ]);
            }

            $fileName = 'AUD-' . str_replace('/', '-', $letter->letter_number) . '.pdf';
            $filePath = 'audiensi/' . $fileName;
            
            Storage::disk('public')->put($filePath, $pdf->output());

            $letter->update([
                'generated_file_path' => $filePath,
            ]);

            return $filePath;
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage(), [
                'letter_id' => $letter->id,
                'sm_sig' => $letter->senior_manager_signature,
                'gm_sig' => $letter->general_manager_signature,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function clientDecision(Request $request, $id)
    {
        $letter = AudiensiLetter::findOrFail($id);
        $request->validate(['decision' => 'required|in:accepted,rejected']);

        if ($letter->status !== 'waiting_client') {
             return response()->json(['message' => 'Invalid status for client decision'], 400);
        }

        if ($request->decision === 'accepted') {
            $letter->update([
                'status' => 'accepted',
                'approved_at' => now(), // Mark final approval time
            ]);
            // Generate final PDF if needed
            $req = new Request();
            $req->merge(['id' => $id]);
            $this->generate($req, $id);
        } else {
            $letter->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);
        }

        return response()->json($letter->fresh());
    }

    public function reject(Request $request, $id)
    {
        $letter = AudiensiLetter::findOrFail($id);
        $letter->update(['status' => 'rejected']);
        return response()->json($letter);
    }

    public function templates(Request $request)
    {
        $templates = AudiensiTemplate::with('creator')->latest()->get();

        return response()->json($templates);
    }

    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'version' => 'required|string',
            'format' => 'required|string',
            'sector' => 'required|string',
            'template_content' => 'required|string',
            'status' => 'sometimes|in:Aktif,Draft',
        ]);

        $validated['created_by'] = $request->user()->id;

        $template = AudiensiTemplate::create($validated);

        return response()->json($template->load('creator'), 201);
    }

    public function destroyTemplate($id)
{
    try {
        $template = AudiensiTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'message' => 'Template audiensi berhasil dihapus'
        ]);
    } catch (\Exception $e) {
        Log::error('Audiensi Template Delete Error: ' . $e->getMessage(), [
            'template_id' => $id,
        ]);
        return response()->json([
            'message' => 'Gagal menghapus template. Silakan coba lagi atau hubungi administrator.',
        ], 500);
    }
}
}