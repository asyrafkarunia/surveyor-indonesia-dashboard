<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InviteCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'created_by',
        'used_by',
        'used_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usedByUser()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function isValid(): bool
    {
        return $this->is_active
            && !$this->used_by
            && $this->expires_at->isFuture();
    }

    public function markAsUsed(int $userId): void
    {
        $this->update([
            'used_by' => $userId,
            'used_at' => now(),
            'is_active' => false,
        ]);
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(substr(str_replace(['0', 'O', 'I', 'l'], '', bin2hex(\random_bytes(5))), 0, 8));
        } while (self::where('code', $code)->exists());

        return $code;
    }
}
