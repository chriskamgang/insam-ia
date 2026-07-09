<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'price', 'billing_cycle', 'features', 'limits', 'is_active', 'sort_order'];
    protected $casts = ['features' => 'array', 'limits' => 'array', 'is_active' => 'boolean'];

    public function subscriptions(): HasMany { return $this->hasMany(Subscription::class); }
}
