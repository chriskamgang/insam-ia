<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'icon', 'image', 'api_slug', 'sort_order'];

    public function videos(): HasMany { return $this->hasMany(Video::class); }
    public function roadmapSteps(): HasMany { return $this->hasMany(RoadmapStep::class); }
    public function debouches(): HasMany { return $this->hasMany(Debouche::class); }
    public function certifications(): HasMany { return $this->hasMany(Certification::class); }
    public function exams(): HasMany { return $this->hasMany(Exam::class); }
    public function quizzes(): HasMany { return $this->hasMany(Quiz::class); }
}
