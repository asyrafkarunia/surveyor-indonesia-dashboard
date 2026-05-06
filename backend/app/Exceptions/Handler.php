<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // ── Global API Error Sanitization ──
        // Ensures NO technical/internal error details are ever exposed to the client.
        // All raw exceptions are logged server-side and replaced with safe, user-friendly messages.
        $this->renderable(function (Throwable $e, $request) {
            // Only intercept API requests (Accept: application/json or /api/ prefix)
            if (!$request->expectsJson() && !$request->is('api/*')) {
                return null; // Let Laravel handle web requests normally
            }

            // ── Validation errors: pass through as-is (these are user-facing by design) ──
            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'Data yang dikirim tidak valid. Silakan periksa kembali.',
                    'errors' => $e->errors(),
                ], 422);
            }

            // ── Authentication: token expired or missing ──
            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Sesi Anda telah berakhir. Silakan login kembali.',
                ], 401);
            }

            // ── Authorization: forbidden action ──
            if ($e instanceof AccessDeniedHttpException) {
                return response()->json([
                    'message' => 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
                ], 403);
            }

            // ── Rate limiting ──
            if ($e instanceof TooManyRequestsHttpException) {
                return response()->json([
                    'message' => 'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba lagi.',
                ], 429);
            }

            // ── Model not found (e.g. deleted record) ──
            if ($e instanceof ModelNotFoundException) {
                return response()->json([
                    'message' => 'Data yang Anda cari tidak ditemukan atau sudah dihapus.',
                ], 404);
            }

            // ── Route not found ──
            if ($e instanceof NotFoundHttpException) {
                return response()->json([
                    'message' => 'Halaman atau endpoint tidak ditemukan.',
                ], 404);
            }

            // ── Method not allowed ──
            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json([
                    'message' => 'Metode permintaan tidak didukung.',
                ], 405);
            }

            // ── Database connection / query errors ──
            if ($e instanceof QueryException) {
                // Log the FULL technical error server-side for debugging
                \Illuminate\Support\Facades\Log::error('Database Error', [
                    'message' => $e->getMessage(),
                    'sql' => $e->getSql(),
                    'bindings' => $e->getBindings(),
                    'trace' => $e->getTraceAsString(),
                    'url' => $request->fullUrl(),
                    'user_id' => $request->user()?->id,
                ]);

                // Return a safe, non-technical message to the client
                return response()->json([
                    'message' => 'Terjadi gangguan pada sistem. Tim teknis telah diberitahu. Silakan coba beberapa saat lagi.',
                ], 500);
            }

            // ── All other unhandled exceptions (catch-all safety net) ──
            \Illuminate\Support\Facades\Log::error('Unhandled Exception', [
                'type' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'url' => $request->fullUrl(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator.',
            ], 500);
        });
    }
}
