<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
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
        'started_at',
        'ended_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_data' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Get the widget that owns the chat.
     */
    public function widget(): BelongsTo
    {
        return $this->belongsTo(Widget::class);
    }

    /**
     * Get the messages for the chat.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'session_id', 'session_id');
    }

    /**
     * Get the user that owns the widget (through widget relationship).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->through('widget');
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
     * Get the duration of the chat in minutes.
     */
    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->ended_at) {
            return null;
        }

        return $this->started_at->diffInMinutes($this->ended_at);
    }

    /**
     * Get the message count for this chat.
     */
    public function getMessageCountAttribute(): int
    {
        return $this->messages()->count();
    }
}
