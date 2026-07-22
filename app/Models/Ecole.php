<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Ecole extends Model
{
    protected $fillable = ['name', 'description', 'logo', 'ville', 'telephone', 'email', 'site_web', 'sort_order'];

    public function filieres(): HasMany
    {
        return $this->hasMany(Filiere::class)->orderBy('sort_order');
    }

    public function specialites(): HasManyThrough
    {
        return $this->hasManyThrough(Specialite::class, Filiere::class);
    }

    public function orientationQuestions(): HasMany
    {
        return $this->hasMany(OrientationQuestion::class);
    }
}
