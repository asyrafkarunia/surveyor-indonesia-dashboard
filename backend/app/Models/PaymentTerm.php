<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'term_number',
        'term_date',
        'percentage',
        'amount',
        'pic_name',
    ];

    protected $casts = [
        'term_date' => 'date',
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
