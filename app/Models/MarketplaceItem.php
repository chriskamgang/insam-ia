<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketplaceItem extends Model
{
    protected $fillable = [
        'seller_id',
        'category_id',
        'title',
        'description',
        'type',
        'matiere',
        'niveau',
        'price',
        'file_path',
        'preview_path',
        'status',
        'downloads_count',
        'rating',
        'reviews_count',
    ];

    protected $casts = [
        'price' => 'integer',
        'downloads_count' => 'integer',
        'rating' => 'float',
        'reviews_count' => 'integer',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(MarketplacePurchase::class, 'item_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(MarketplaceReview::class, 'item_id');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function isFree(): bool
    {
        return $this->price === 0;
    }
}
