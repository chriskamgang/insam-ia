<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizResult extends Model
{
    protected $fillable = [
        'quiz_id',
        'user_id',
        'score',
        'total',
        'answers',
        'ai_feedback',
        'corrections',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'corrections'  => 'array',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
