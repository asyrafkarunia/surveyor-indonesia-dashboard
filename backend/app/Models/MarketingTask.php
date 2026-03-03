<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'client',
        'priority',
        'date',
        'assignee_id',
        'status',
        'tags',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
        'tags' => 'array',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments()
    {
        return $this->hasMany(MarketingTaskComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(MarketingTaskAttachment::class);
    }
}
