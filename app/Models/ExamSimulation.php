<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSimulation extends Model
{
    protected $fillable = ['user_id', 'exam_id', 'category_id', 'title', 'duration_minutes', 'started_at', 'finished_at', 'answers', 'score', 'ai_feedback', 'detailed_scores', 'status'];

    protected $casts = [
        'detailed_scores' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function exam(): BelongsTo { return $this->belongsTo(Exam::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
}
