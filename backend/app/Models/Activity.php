<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'content',
        'project_id',
        'tags',
        'mentions',
        'attachment_name',
        'attachment_path',
        'attachment_type',
        'attachment_size',
        'is_urgent',
    ];

    protected $casts = [
        'tags' => 'array',
        'mentions' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function likes()
    {
        return $this->hasMany(ActivityLike::class);
    }

    public function comments()
    {
        return $this->hasMany(ActivityComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(ActivityAttachment::class);
    }

    public function mentionedUsers()
    {
        return $this->belongsToMany(User::class, 'activity_mentions', 'activity_id', 'user_id');
    }
}
