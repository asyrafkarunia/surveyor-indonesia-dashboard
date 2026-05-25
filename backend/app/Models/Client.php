<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'company_name',
        'logo',
        'contact_person',
        'contact_role',
        'type',
        'status',
        'email',
        'phone',
        'industry',
        'location',
        'address',
        'notes',
    ];

    /**
     * Normalize Indonesian phone numbers for WhatsApp API compatibility.
     * Converts "08xxx" → "628xxx", strips non-digit characters.
     */
    public function setPhoneAttribute($value)
    {
        if (!$value) {
            $this->attributes['phone'] = $value;
            return;
        }

        // Strip all non-digit characters
        $digits = preg_replace('/\D/', '', $value);

        // Convert 08xx to 628xx
        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        }

        $this->attributes['phone'] = $digits;
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function sph()
    {
        return $this->hasMany(Sph::class);
    }

    public function audiensiLetters()
    {
        return $this->hasMany(AudiensiLetter::class);
    }
}
