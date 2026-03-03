<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AudiensiTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'version',
        'format',
        'sector',
        'template_content',
        'status',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function letters()
    {
        return $this->hasMany(AudiensiLetter::class, 'template_id');
    }
}
