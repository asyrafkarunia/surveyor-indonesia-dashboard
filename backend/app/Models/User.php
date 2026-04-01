<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

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

    public function getRoleNameAttribute()
    {
        if ($this->name === 'Ibnu Khaldun' && $this->role === 'approver') {
            return 'General Manager';
        }
        
        switch ($this->role) {
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
        return $this->role === 'marketing';
    }

    public function isApprover()
    {
        return $this->role === 'approver';
    }

    public function isCommon()
    {
        return $this->role === 'common';
    }
}
