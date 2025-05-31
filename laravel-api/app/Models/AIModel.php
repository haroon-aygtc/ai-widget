<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIModel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'ai_provider_id',
        'name',
        'model_id',
        'provider_type',
        'description',
        'temperature',
        'max_tokens',
        'system_prompt',
        'capabilities',
        'configuration',
        'performance_metrics',
        'is_active',
        'is_featured'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'temperature' => 'float',
        'max_tokens' => 'integer',
        'capabilities' => 'array',
        'configuration' => 'array',
        'performance_metrics' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    /**
     * Get the user that owns the AI model.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the AI provider associated with this model.
     */
    public function aiProvider()
    {
        return $this->belongsTo(AIProvider::class, 'ai_provider_id');
    }
}