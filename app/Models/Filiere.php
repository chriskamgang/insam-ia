<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filiere extends Model
{
    protected $fillable = ['ecole_id', 'name', 'description', 'icon', 'sort_order'];

    public function ecole(): BelongsTo
    {
        return $this->belongsTo(Ecole::class);
    }

    public function specialites(): HasMany
    {
        return $this->hasMany(Specialite::class)->orderBy('sort_order');
    }

    public function orientationQuestions(): HasMany
    {
        return $this->hasMany(OrientationQuestion::class);
    }
}
