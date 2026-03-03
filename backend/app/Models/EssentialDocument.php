<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EssentialDocument extends Model
{
    protected $fillable = [
        'title',
        'description',
        'file_name',
        'file_path',
        'file_size',
        'uploaded_by',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}