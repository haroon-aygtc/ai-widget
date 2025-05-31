<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIModel extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ai_models';

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

    /**
     * Scope to get active models only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get featured models only.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to get models by provider type.
     */
    public function scopeByProvider($query, string $providerType)
    {
        return $query->where('provider_type', $providerType);
    }

    /**
     * Get the full model identifier including provider.
     */
    public function getFullModelIdAttribute(): string
    {
        return $this->provider_type . '/' . $this->model_id;
    }

    /**
     * Update performance metrics.
     */
    public function updatePerformanceMetrics(array $metrics): void
    {
        $currentMetrics = $this->performance_metrics ?? [];
        $this->update([
            'performance_metrics' => array_merge($currentMetrics, $metrics)
        ]);
    }
}