<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'session_id',
        'widget_id',
        'sender_type',
        'message',
        'response',
        'user_data',
        'ip_address',
        'user_agent',
        'response_time',
        'token_usage',
        'model_used',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_data' => 'array',
        'token_usage' => 'array',
        'response_time' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the widget that owns the message.
     */
    public function widget(): BelongsTo
    {
        return $this->belongsTo(Widget::class);
    }

    /**
     * Scope to get messages for a specific session.
     */
    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope to get user messages.
     */
    public function scopeUserMessages($query)
    {
        return $query->where('sender_type', 'user');
    }

    /**
     * Scope to get AI messages.
     */
    public function scopeAiMessages($query)
    {
        return $query->where('sender_type', 'ai');
    }
}
