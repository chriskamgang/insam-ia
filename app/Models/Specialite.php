<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Specialite extends Model
{
    protected $fillable = ['filiere_id', 'name', 'description', 'diplome', 'duree', 'avantages', 'debouches', 'competences', 'icon', 'sort_order'];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }
}
