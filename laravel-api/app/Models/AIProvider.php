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
    protected $table = 'ai_providers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'provider_type',
        'name',
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
     * The attributes that should be encrypted.
     *
     * @var array<int, string>
     */
    protected $encrypted = [
        'api_key',
    ];

    /**
     * Get the decrypted API key.
     */
    public function getDecryptedApiKeyAttribute(): ?string
    {
        if (empty($this->api_key)) {
            return null;
        }

        try {
            return \Illuminate\Support\Facades\Crypt::decryptString($this->api_key);
        } catch (\Exception $e) {
            // If decryption fails, assume it's already decrypted (for backward compatibility or testing)
            return $this->api_key;
        }
    }

    /**
     * Get the raw API key for testing purposes.
     * This method handles both encrypted and plain text keys.
     */
    public function getRawApiKey(): ?string
    {
        if (empty($this->attributes['api_key'])) {
            return null;
        }

        // If this is a temporary instance (not saved to database), return the raw value
        if (!$this->exists) {
            return $this->attributes['api_key'];
        }

        // For saved instances, use the decrypted accessor
        return $this->decrypted_api_key;
    }

    /**
     * Set the API key (encrypt it).
     */
    public function setApiKeyAttribute($value): void
    {
        if (empty($value)) {
            $this->attributes['api_key'] = null;
            return;
        }

        try {
            // Try to decrypt - if it works, it's already encrypted
            \Illuminate\Support\Facades\Crypt::decryptString($value);
            $this->attributes['api_key'] = $value;
        } catch (\Exception $e) {
            // If decryption fails, it's not encrypted, so encrypt it
            $this->attributes['api_key'] = \Illuminate\Support\Facades\Crypt::encryptString($value);
        }
    }

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

    /**
     * Get the AI models associated with this provider.
     */
    public function aiModels()
    {
        return $this->hasMany(AIModel::class);
    }

    /**
     * Scope to get active providers only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get providers by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('provider_type', $type);
    }

    /**
     * Update the last used timestamp.
     */
    public function updateLastUsed(): void
    {
        $this->update(['last_used' => now()]);
    }
}
