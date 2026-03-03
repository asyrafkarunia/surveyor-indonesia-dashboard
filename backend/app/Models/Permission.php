<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_permissions')
            ->withPivot('is_enabled')
            ->withTimestamps();
    }
}
