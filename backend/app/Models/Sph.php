<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sph extends Model
{
    use HasFactory;

    protected $table = 'sph';

    protected $fillable = [
        'sph_no',
        'client_id',
        'project_id',
        'project_name',
        'value',
        'date_created',
        'status',
        'description',
        'items',
        'validity_period',
        'validity_months',
        'scope_of_work',
        'time_period',
        'term_payment',
        'bank_name',
        'bank_acc_no',
        'is_new_application',
        'terms_conditions',
        'generated_file_path',
        'senior_manager_signature',
        'general_manager_signature',
        'created_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'date_created' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'validity_period' => 'date',
        'validity_months' => 'integer',
        'is_new_application' => 'boolean',
        'value' => 'decimal:2',
        'items' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
