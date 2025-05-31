<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Widget;
use App\Models\AIProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class WidgetControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected AIProvider $aiProvider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->aiProvider = AIProvider::factory()->create([
            'user_id' => $this->user->id,
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_can_create_widget(): void
    {
        $widgetData = [
            'name' => 'Test Widget',
            'description' => 'A test widget',
            'ai_provider_id' => $this->aiProvider->id,
            'design' => [
                'primaryColor' => '#3b82f6',
                'secondaryColor' => '#f3f4f6',
                'textColor' => '#111827',
                'fontFamily' => 'Inter',
                'fontSize' => 14,
                'borderRadius' => 8,
                'headerText' => 'Chat Assistant',
                'buttonText' => 'Send',
                'placeholderText' => 'Type here...',
            ],
            'behavior' => [
                'welcomeMessage' => 'Hello!',
                'typingIndicator' => true,
                'showTimestamp' => true,
                'autoResponse' => true,
                'responseDelay' => 500,
                'maxMessages' => 50,
            ],
            'placement' => [
                'position' => 'bottom-right',
                'offsetX' => 20,
                'offsetY' => 20,
                'mobilePosition' => 'bottom',
                'showOnPages' => 'all',
                'excludePages' => '',
                'triggerType' => 'button',
                'triggerText' => 'Chat',
            ],
            'status' => 'active',
        ];

        $response = $this->postJson('/api/widgets', $widgetData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'id',
                    'name',
                    'design',
                    'behavior',
                    'placement',
                    'status',
                    'embed_code',
                    'created_at',
                    'updated_at',
                ]);

        $this->assertDatabaseHas('widgets', [
            'name' => 'Test Widget',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_can_list_widgets(): void
    {
        Widget::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
        ]);

        $response = $this->getJson('/api/widgets');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'status',
                            'created_at',
                        ]
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ]);
    }

    public function test_can_show_widget(): void
    {
        $widget = Widget::factory()->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
        ]);

        $response = $this->getJson("/api/widgets/{$widget->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'id' => $widget->id,
                    'name' => $widget->name,
                ]);
    }

    public function test_can_update_widget(): void
    {
        $widget = Widget::factory()->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
        ]);

        $updateData = [
            'name' => 'Updated Widget Name',
            'status' => 'draft',
        ];

        $response = $this->putJson("/api/widgets/{$widget->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'id' => $widget->id,
                    'name' => 'Updated Widget Name',
                    'status' => 'draft',
                ]);

        $this->assertDatabaseHas('widgets', [
            'id' => $widget->id,
            'name' => 'Updated Widget Name',
            'status' => 'draft',
        ]);
    }

    public function test_can_delete_widget(): void
    {
        $widget = Widget::factory()->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
        ]);

        $response = $this->deleteJson("/api/widgets/{$widget->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('widgets', [
            'id' => $widget->id,
        ]);
    }

    public function test_can_generate_embed_code(): void
    {
        $widget = Widget::factory()->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
        ]);

        $response = $this->postJson("/api/widgets/{$widget->id}/generate-embed-code");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'embed_code',
                    'widget_id',
                    'instructions',
                ]);
    }

    public function test_cannot_access_other_users_widgets(): void
    {
        $otherUser = User::factory()->create();
        $otherWidget = Widget::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/widgets/{$otherWidget->id}");

        $response->assertStatus(404);
    }

    public function test_widget_validation(): void
    {
        $response = $this->postJson('/api/widgets', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors([
                    'name',
                    'design',
                    'behavior',
                    'placement',
                    'status',
                ]);
    }
}