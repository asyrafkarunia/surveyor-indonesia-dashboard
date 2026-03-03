<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'name',
        'path',
        'type',
        'size',
    ];

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }
}
