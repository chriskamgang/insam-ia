<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniteEnseignement extends Model
{
    protected $table = 'unites_enseignement';

    protected $fillable = [
        'nom', 'code', 'filiere', 'annee', 'semestre',
        'category_id', 'specialite_id', 'coefficient', 'sort_order',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function specialite(): BelongsTo
    {
        return $this->belongsTo(Specialite::class);
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'ue_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserCourseProgress::class, 'ue_id');
    }

    public function knowledgeDocuments(): HasMany
    {
        return $this->hasMany(KnowledgeDocument::class, 'ue_id');
    }
}
