<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTutorial extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tutorial_id',
        'completed_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
