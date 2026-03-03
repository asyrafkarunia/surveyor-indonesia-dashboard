<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AudiensiLetter extends Model
{
    use HasFactory;

    protected $fillable = [
        'letter_number',
        'date',
        'client_id',
        'company_name',
        'sector',
        'purpose',
        'template_id',
        'content',
        'generated_file_path',
        'senior_manager_signature',
        'general_manager_signature',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function template()
    {
        return $this->belongsTo(AudiensiTemplate::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
