<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\Widget;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $senderType = $this->faker->randomElement(['user', 'ai']);

        return [
            'session_id' => $this->faker->uuid(),
            'widget_id' => Widget::factory(),
            'sender_type' => $senderType,
            'message' => $senderType === 'user' ? $this->faker->sentence() : null,
            'response' => $senderType === 'ai' ? $this->faker->paragraph() : null,
            'user_data' => $senderType === 'user' ? [
                'name' => $this->faker->name(),
                'email' => $this->faker->email(),
            ] : null,
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'response_time' => $senderType === 'ai' ? $this->faker->randomFloat(3, 0.1, 5.0) : null,
            'token_usage' => $senderType === 'ai' ? [
                'prompt_tokens' => $this->faker->numberBetween(10, 100),
                'completion_tokens' => $this->faker->numberBetween(20, 200),
                'total_tokens' => $this->faker->numberBetween(30, 300),
            ] : null,
            'model_used' => $senderType === 'ai' ? $this->faker->randomElement([
                'gpt-3.5-turbo',
                'gemini-1.5-flash',
                'claude-3-haiku-20240307',
                'mistral-small-latest'
            ]) : null,
        ];
    }

    /**
     * Indicate that this is a user message.
     */
    public function userMessage(): static
    {
        return $this->state(fn (array $attributes) => [
            'sender_type' => 'user',
            'message' => $this->faker->sentence(),
            'response' => null,
            'response_time' => null,
            'token_usage' => null,
            'model_used' => null,
        ]);
    }

    /**
     * Indicate that this is an AI message.
     */
    public function aiMessage(): static
    {
        return $this->state(fn (array $attributes) => [
            'sender_type' => 'ai',
            'message' => null,
            'response' => $this->faker->paragraph(),
            'response_time' => $this->faker->randomFloat(3, 0.1, 5.0),
            'token_usage' => [
                'prompt_tokens' => $this->faker->numberBetween(10, 100),
                'completion_tokens' => $this->faker->numberBetween(20, 200),
                'total_tokens' => $this->faker->numberBetween(30, 300),
            ],
            'model_used' => $this->faker->randomElement([
                'gpt-3.5-turbo',
                'gemini-1.5-flash',
                'claude-3-haiku-20240307',
                'mistral-small-latest'
            ]),
        ]);
    }

    /**
     * Set specific session ID.
     */
    public function forSession(string $sessionId): static
    {
        return $this->state(fn (array $attributes) => [
            'session_id' => $sessionId,
        ]);
    }
}