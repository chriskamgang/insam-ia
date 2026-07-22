<?php
namespace App\Models;

use App\Jobs\GenerateExamCorrection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exam extends Model
{
    protected static function booted(): void
    {
        static::created(function (Exam $exam) {
            if (!$exam->is_corrected) {
                GenerateExamCorrection::dispatch($exam);
            }
        });
    }

    protected $fillable = [
        'title',
        'exam_type',
        'category_id',
        'ue_id',
        'filiere',
        'matiere',
        'niveau',
        'annee',
        'file_path',
        'correction_path',
        'is_corrected',
        'uploaded_by',
        'source',
        'downloads_count',
    ];

    protected $casts = [
        'is_corrected' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function ue(): BelongsTo
    {
        return $this->belongsTo(UniteEnseignement::class, 'ue_id');
    }

    public function unitesEnseignement(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(UniteEnseignement::class, 'exam_ue', 'exam_id', 'ue_id');
    }
}
