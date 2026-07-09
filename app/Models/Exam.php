<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exam extends Model
{
    protected $fillable = [
        'title',
        'category_id',
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
}
