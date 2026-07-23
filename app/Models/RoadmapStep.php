<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoadmapStep extends Model
{
    protected $fillable = [
        'category_id',
        'step_number',
        'title',
        'description',
        'level',
        'duration',
        'skills',
        'icon',
        'color',
        'ai_details',
        'sort_order',
    ];

    protected $casts = [
        'ai_details' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
