<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrientationQuestion extends Model
{
    protected $fillable = ['level', 'ecole_id', 'filiere_id', 'question', 'options', 'scores', 'sort_order'];

    protected $casts = [
        'options' => 'array',
        'scores' => 'array',
    ];

    public function ecole(): BelongsTo
    {
        return $this->belongsTo(Ecole::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }
}
