<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RevisionCard extends Model
{
    protected $fillable = ['user_id', 'category_id', 'title', 'content', 'summary', 'key_points', 'status', 'source'];

    protected $casts = [
        'key_points' => 'array',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
}
