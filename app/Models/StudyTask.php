<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyTask extends Model
{
    protected $fillable = ['study_plan_id', 'title', 'description', 'due_date', 'due_time', 'type', 'priority', 'completed', 'completed_at', 'sort_order'];

    protected $casts = [
        'due_date' => 'date',
        'completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function plan(): BelongsTo { return $this->belongsTo(StudyPlan::class, 'study_plan_id'); }
}
