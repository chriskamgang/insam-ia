<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplacePurchase extends Model
{
    protected $fillable = [
        'buyer_id',
        'item_id',
        'amount_paid',
        'payment_method',
        'payment_reference',
    ];

    protected $casts = [
        'amount_paid' => 'integer',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(MarketplaceItem::class, 'item_id');
    }
}
