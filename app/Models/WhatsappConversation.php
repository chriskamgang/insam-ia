<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappConversation extends Model
{
    protected $fillable = [
        'phone', 'name', 'transferred', 'transfer_reason', 'transferred_at', 'last_message_at',
    ];

    protected $casts = [
        'transferred' => 'boolean',
        'transferred_at' => 'datetime',
        'last_message_at' => 'datetime',
    ];

    public function messages()
    {
        return $this->hasMany(WhatsappMessage::class, 'conversation_id');
    }
}
