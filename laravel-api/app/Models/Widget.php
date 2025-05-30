<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Widget extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'a_i_provider_id',
        'name',
        'design',
        'behavior',
        'placement',
        'status',
        'embed_code',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'design' => 'array',
        'behavior' => 'array',
        'placement' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($widget) {
            if (empty($widget->embed_code)) {
                $widget->embed_code = Str::uuid()->toString();
            }
        });
    }

    /**
     * Get the user that owns the widget.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the AI provider associated with the widget.
     */
    public function aiProvider()
    {
        return $this->belongsTo(AIProvider::class, 'a_i_provider_id');
    }

    /**
     * Get the chat histories for the widget.
     */
    public function chatHistories()
    {
        return $this->hasMany(ChatHistory::class);
    }
}
