<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyllabusVerification extends Model
{
    protected $fillable = [
        'course_title', 'category_id', 'document_id',
        'syllabus', 'support', 'result', 'score',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function document()
    {
        return $this->belongsTo(KnowledgeDocument::class, 'document_id');
    }
}
