<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'client_id',
        'start_date',
        'end_date',
        'progress',
        'status',
        'pic_id',
        'custom_pic_name',
        'custom_team_notes',
        'budget',
        'actual_revenue',
        'description',
        'icon',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'location_address',
        'latitude',
        'longitude',
        'project_type',
        'target_margin',
        'compliance_requirements',
        'quality_standard',
        'target_compliance',
        'is_tender',
        'pic_marketing_id',
        'team_members',
        'locations',
        'schedule_data',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'budget' => 'decimal:2',
        'actual_revenue' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'target_margin' => 'decimal:2',
        'team_members' => 'array',
        'locations' => 'array',
        'schedule_data' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }

    public function marketingPic()
    {
        return $this->belongsTo(User::class, 'pic_marketing_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attachments()
    {
        return $this->hasMany(ProjectAttachment::class);
    }

    public function comments()
    {
        return $this->hasMany(ProjectComment::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function paymentTerms()
    {
        return $this->hasMany(PaymentTerm::class)->orderBy('term_number');
    }
}
