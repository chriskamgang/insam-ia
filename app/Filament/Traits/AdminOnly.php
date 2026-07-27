<?php

namespace App\Filament\Traits;

use Illuminate\Support\Facades\Auth;

trait AdminOnly
{
    public static function canAccess(): bool
    {
        return Auth::check() && Auth::user()->isAdmin();
    }
}
