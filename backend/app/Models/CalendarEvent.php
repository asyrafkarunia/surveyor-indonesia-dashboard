<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'date',
        'duration_days',
        'end_date',
        'start_time',
        'end_time',
        'user_id',
        'project_id',
        'type',
        'color',
        'is_recurring',
        'recurring_frequency',
        'recurring_interval',
        'recurring_end_type',
        'recurring_end_date',
        'recurring_count',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
