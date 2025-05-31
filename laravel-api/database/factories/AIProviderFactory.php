<?php

namespace Database\Factories;

use App\Models\AIProvider;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Crypt;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AIProvider>
 */
class AIProviderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $providerType = $this->faker->randomElement(['openai', 'gemini', 'claude', 'mistral']);

        return [
            'user_id' => User::factory(),
            'provider_type' => $providerType,
            'api_key' => Crypt::encryptString('test-api-key-' . $this->faker->uuid()),
            'model' => $this->getDefaultModel($providerType),
            'temperature' => $this->faker->randomFloat(2, 0, 1),
            'max_tokens' => $this->faker->numberBetween(1000, 4000),
            'system_prompt' => $this->faker->optional()->paragraph(),
            'advanced_settings' => [
                'top_p' => $this->faker->randomFloat(2, 0, 1),
                'frequency_penalty' => $this->faker->randomFloat(2, 0, 2),
                'presence_penalty' => $this->faker->randomFloat(2, 0, 2),
            ],
            'is_active' => $this->faker->boolean(80), // 80% chance of being active
        ];
    }

    /**
     * Get default model for provider type.
     */
    private function getDefaultModel(string $providerType): string
    {
        return match ($providerType) {
            'openai' => 'gpt-3.5-turbo',
            'gemini' => 'gemini-1.5-flash',
            'claude' => 'claude-3-haiku-20240307',
            'mistral' => 'mistral-small-latest',
            default => 'gpt-3.5-turbo',
        };
    }

    /**
     * Indicate that the provider is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the provider is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Set specific provider type.
     */
    public function provider(string $type): static
    {
        return $this->state(fn (array $attributes) => [
            'provider_type' => $type,
            'model' => $this->getDefaultModel($type),
        ]);
    }
}