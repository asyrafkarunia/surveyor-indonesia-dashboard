<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MarketingTaskAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'marketing_task_id',
        'user_id',
        'label',
        'url',
    ];

    public function task()
    {
        return $this->belongsTo(MarketingTask::class, 'marketing_task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}