<?php

namespace Database\Factories;

use App\Models\Widget;
use App\Models\User;
use App\Models\AIProvider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Widget>
 */
class WidgetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'a_i_provider_id' => AIProvider::factory(),
            'name' => $this->faker->words(3, true),
            'design' => [
                'primaryColor' => $this->faker->hexColor(),
                'secondaryColor' => $this->faker->hexColor(),
                'textColor' => $this->faker->hexColor(),
                'fontFamily' => $this->faker->randomElement(['Inter', 'Roboto', 'Open Sans']),
                'fontSize' => $this->faker->numberBetween(12, 18),
                'borderRadius' => $this->faker->numberBetween(4, 12),
                'headerText' => $this->faker->sentence(3),
                'buttonText' => $this->faker->word(),
                'placeholderText' => $this->faker->sentence(),
            ],
            'behavior' => [
                'welcomeMessage' => $this->faker->sentence(),
                'initialMessage' => $this->faker->sentence(),
                'typingIndicator' => $this->faker->boolean(),
                'showTimestamp' => $this->faker->boolean(),
                'autoResponse' => $this->faker->boolean(),
                'responseDelay' => $this->faker->numberBetween(100, 2000),
                'maxMessages' => $this->faker->numberBetween(10, 100),
                'aiProvider' => $this->faker->randomElement(['openai', 'gemini', 'claude']),
            ],
            'placement' => [
                'position' => $this->faker->randomElement(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
                'offsetX' => $this->faker->numberBetween(10, 50),
                'offsetY' => $this->faker->numberBetween(10, 50),
                'mobilePosition' => $this->faker->randomElement(['bottom', 'bottom-right', 'bottom-left']),
                'showOnPages' => $this->faker->randomElement(['all', 'specific', 'homepage']),
                'excludePages' => $this->faker->optional()->sentence(),
                'triggerType' => $this->faker->randomElement(['button', 'tab', 'auto']),
                'triggerText' => $this->faker->words(2, true),
                'triggerIcon' => 'message',
            ],
            'status' => $this->faker->randomElement(['active', 'draft', 'archived']),
            'embed_code' => Str::uuid(),
        ];
    }

    /**
     * Indicate that the widget is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the widget is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }
}