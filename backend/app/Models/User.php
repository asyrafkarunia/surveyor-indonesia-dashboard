<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\VerifyEmailNotification;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'division',
        'status',
        'avatar',
        'signature',
        'last_activity_at',
        'is_online',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_activity_at' => 'datetime',
        'is_online' => 'boolean',
    ];

    protected $appends = ['role_name'];

    /**
     * Send the email verification notification using custom Indonesian template.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function getAvatarAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return url($value);
    }

    public function getRoleNameAttribute()
    {
        if ($this->name === 'Ibnu Khaldun' && $this->role === 'approver') {
            return 'General Manager';
        }
        
        switch ($this->role) {
            case 'super_admin': return 'Super Admin';
            case 'marketing': return 'Marketing';
            case 'senior_manager': return 'Senior Manager';
            case 'general_manager': return 'General Manager';
            case 'head_section': return 'Head Section';
            case 'approver': return 'Approver';
            default: return ucfirst($this->role);
        }
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'pic_id');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isMarketing()
    {
        return in_array($this->role, ['marketing', 'head_section', 'super_admin']);
    }

    public function isFinance()
    {
        return $this->division === 'Divisi Keuangan';
    }

    public function canUpdateProject()
    {
        return $this->isMarketing() || $this->isFinance() || $this->isSuperAdmin();
    }

    public function isApprover()
    {
        return $this->role === 'approver';
    }

    public function isCommon()
    {
        return $this->role === 'common';
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    /**
     * Get numeric hierarchy level for role comparison.
     * Higher number = higher privilege.
     */
    public function getRoleLevel(): int
    {
        $levels = [
            'common' => 1,
            'approver' => 2,
            'senior_manager' => 2,
            'general_manager' => 2,
            'marketing' => 3,
            'head_section' => 4,
            'super_admin' => 5,
        ];
        return $levels[$this->role] ?? 0;
    }
}
