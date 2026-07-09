<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Video extends Model
{
    protected $fillable = [
        'title',
        'description',
        'filename',
        'thumbnail',
        'category_id',
        'views_count',
        'duration',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
