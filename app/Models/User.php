<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'nom', 'prenom', 'email', 'password',
        'telephone', 'filiere', 'niveau', 'category_id', 'role', 'avatar', 'locale',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->role === 'admin';
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function quizResults()
    {
        return $this->hasMany(QuizResult::class);
    }

    public function subscriptions() { return $this->hasMany(Subscription::class); }

    public function activeSubscription()
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();
    }

    public function currentPlan()
    {
        $sub = $this->activeSubscription();
        return $sub ? $sub->plan : Plan::where('slug', 'free')->first();
    }

    public function isPremium(): bool
    {
        $plan = $this->currentPlan();
        return $plan && $plan->slug !== 'free';
    }

    public function checkLimit(string $key, int $usage): bool
    {
        $plan = $this->currentPlan();
        if (!$plan) return false;
        $limits = $plan->limits ?? [];
        if (!isset($limits[$key])) return true; // no limit defined = unlimited
        return $usage < $limits[$key];
    }
}
