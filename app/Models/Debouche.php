<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debouche extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'description',
        'icon',
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
