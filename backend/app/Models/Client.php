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
    ];

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
