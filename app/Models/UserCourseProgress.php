<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCourseProgress extends Model
{
    protected $table = 'user_course_progress';

    protected $fillable = [
        'user_id', 'type', 'subject', 'title', 'score',
        'total_questions', 'correct_answers',
        'course_completed', 'quiz_completed', 'details',
    ];

    protected $casts = [
        'details' => 'array',
        'course_completed' => 'boolean',
        'quiz_completed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
