<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatHistory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'widget_id',
        'session_id',
        'user_name',
        'user_email',
        'user_phone',
        'user_data',
        'status',
        'last_message_at',
        'message_count',
        'total_response_time',
        'avg_response_time',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_data' => 'array',
        'last_message_at' => 'datetime',
        'message_count' => 'integer',
        'total_response_time' => 'float',
        'avg_response_time' => 'float',
    ];

    /**
     * Get the widget that owns the chat history.
     */
    public function widget(): BelongsTo
    {
        return $this->belongsTo(Widget::class);
    }

    /**
     * Get the messages for this chat session.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'session_id', 'session_id');
    }

    /**
     * Scope to get active chats.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get chats for a specific widget.
     */
    public function scopeForWidget($query, $widgetId)
    {
        return $query->where('widget_id', $widgetId);
    }

    /**
     * Update chat statistics.
     */
    public function updateStats(): void
    {
        $messages = $this->messages;
        $this->message_count = $messages->count();

        $aiMessages = $messages->where('sender_type', 'ai');
        if ($aiMessages->isNotEmpty()) {
            $this->total_response_time = $aiMessages->sum('response_time');
            $this->avg_response_time = $aiMessages->avg('response_time');
        }

        $this->last_message_at = $messages->max('created_at');
        $this->save();
    }
}
