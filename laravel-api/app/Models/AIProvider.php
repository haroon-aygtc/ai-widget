<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIProvider extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'a_i_providers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'provider_type',
        'api_key',
        'model',
        'temperature',
        'max_tokens',
        'system_prompt',
        'advanced_settings',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'temperature' => 'float',
        'max_tokens' => 'integer',
        'advanced_settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns the AI provider.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the widgets that use this AI provider.
     */
    public function widgets()
    {
        return $this->hasMany(Widget::class);
    }
}
