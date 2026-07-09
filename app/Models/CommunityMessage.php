<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunityMessage extends Model
{
    protected $fillable = ['user_id', 'channel', 'content', 'type', 'parent_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(CommunityMessage::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(CommunityMessage::class, 'parent_id');
    }
}
