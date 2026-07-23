<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroMedia extends Model
{
    protected $table = 'hero_media';

    protected $fillable = [
        'type',
        'filename',
        'title',
        'sort_order',
    ];
}
