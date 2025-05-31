<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Widget;
use App\Models\AIProvider;
use App\Models\Message;
use App\Models\ChatHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected Widget $widget;
    protected AIProvider $aiProvider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->aiProvider = AIProvider::factory()->create([
            'user_id' => $this->user->id,
        ]);
        $this->widget = Widget::factory()->create([
            'user_id' => $this->user->id,
            'a_i_provider_id' => $this->aiProvider->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_can_send_message(): void
    {
        $messageData = [
            'widget_id' => $this->widget->embed_code,
            'session_id' => 'test-session-123',
            'message' => 'Hello, this is a test message',
            'user_data' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
            ],
        ];

        // Mock the AI service response
        $this->mock(\App\Services\AI\AIService::class, function ($mock) {
            $mock->shouldReceive('processMessage')
                 ->once()
                 ->andReturn([
                     'success' => true,
                     'response' => 'Hello! How can I help you today?',
                     'response_time' => 0.5,
                     'token_usage' => ['total_tokens' => 25],
                 ]);
        });

        $response = $this->postJson('/api/chats/send-message', $messageData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'response',
                    'message_id',
                    'response_time',
                ]);

        $this->assertDatabaseHas('messages', [
            'session_id' => 'test-session-123',
            'widget_id' => $this->widget->id,
            'sender_type' => 'user',
            'message' => 'Hello, this is a test message',
        ]);

        $this->assertDatabaseHas('messages', [
            'session_id' => 'test-session-123',
            'widget_id' => $this->widget->id,
            'sender_type' => 'ai',
            'message' => 'Hello! How can I help you today?',
        ]);
    }

    public function test_can_get_chat_history_by_session(): void
    {
        $sessionId = 'test-session-456';

        Message::factory()->count(3)->create([
            'session_id' => $sessionId,
            'widget_id' => $this->widget->id,
        ]);

        $response = $this->getJson("/api/chats/{$sessionId}");

        $response->assertStatus(200)
                ->assertJsonCount(3);
    }

    public function test_can_list_chats(): void
    {
        ChatHistory::factory()->count(5)->create([
            'widget_id' => $this->widget->id,
        ]);

        $response = $this->getJson('/api/chats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ]);
    }

    public function test_message_validation(): void
    {
        $response = $this->postJson('/api/chats/send-message', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors([
                    'widget_id',
                    'session_id',
                    'message',
                ]);
    }

    public function test_rate_limiting_on_messages(): void
    {
        $messageData = [
            'widget_id' => $this->widget->embed_code,
            'session_id' => 'rate-limit-test',
            'message' => 'Test message',
        ];

        // Mock the AI service
        $this->mock(\App\Services\AI\AIService::class, function ($mock) {
            $mock->shouldReceive('processMessage')
                 ->andReturn([
                     'success' => true,
                     'response' => 'Response',
                     'response_time' => 0.1,
                 ]);
        });

        // Send multiple requests rapidly
        for ($i = 0; $i < 35; $i++) {
            $response = $this->postJson('/api/chats/send-message', $messageData);

            if ($i < 30) {
                $response->assertStatus(200);
            } else {
                $response->assertStatus(429); // Rate limit exceeded
                break;
            }
        }
    }

    public function test_can_delete_chat_session(): void
    {
        $sessionId = 'delete-test-session';

        $chatHistory = ChatHistory::factory()->create([
            'widget_id' => $this->widget->id,
            'session_id' => $sessionId,
        ]);

        Message::factory()->count(3)->create([
            'session_id' => $sessionId,
            'widget_id' => $this->widget->id,
        ]);

        $response = $this->deleteJson("/api/chats/{$sessionId}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('chat_histories', [
            'session_id' => $sessionId,
        ]);

        $this->assertDatabaseMissing('messages', [
            'session_id' => $sessionId,
        ]);
    }
}