<?php

use Illuminate\Support\Facades\Route;

// SPA - React handles all frontend routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|admin|storage).*$');
