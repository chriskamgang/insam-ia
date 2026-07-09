<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category_id',
        'duration_minutes',
        'is_published',
    ];

    protected $casts = [
        'is_published'     => 'boolean',
        'duration_minutes' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(QuizResult::class);
    }
}
