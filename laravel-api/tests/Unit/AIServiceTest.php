<?php

namespace Tests\Unit;

use App\Services\AI\AIService;
use App\Services\AI\GeminiService;
use App\Services\AI\MistralService;
use App\Services\AI\ClaudeService;
use Tests\TestCase;
use Mockery;

class AIServiceTest extends TestCase
{
    protected AIService $aiService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->aiService = new AIService();
    }

    public function test_can_get_available_providers(): void
    {
        $providers = $this->aiService->getAvailableProviders();

        $this->assertIsArray($providers);
        $this->assertContains('openai', $providers);
        $this->assertContains('gemini', $providers);
        $this->assertContains('claude', $providers);
        $this->assertContains('mistral', $providers);
    }

    public function test_can_get_provider_instance(): void
    {
        $geminiProvider = $this->aiService->getProvider('gemini');
        $this->assertInstanceOf(GeminiService::class, $geminiProvider);

        $mistralProvider = $this->aiService->getProvider('mistral');
        $this->assertInstanceOf(MistralService::class, $mistralProvider);

        $claudeProvider = $this->aiService->getProvider('claude');
        $this->assertInstanceOf(ClaudeService::class, $claudeProvider);
    }

    public function test_throws_exception_for_unsupported_provider(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("AI provider 'unsupported' not supported");

        $this->aiService->getProvider('unsupported');
    }

    public function test_can_process_message_with_context(): void
    {
        $mockProvider = Mockery::mock(GeminiService::class);
        $mockProvider->shouldReceive('generateResponse')
                    ->once()
                    ->with('Hello', Mockery::type('array'))
                    ->andReturn([
                        'success' => true,
                        'response' => 'Hi there!',
                        'model' => 'gemini-1.5-flash',
                    ]);

        // Mock the provider creation
        $aiService = Mockery::mock(AIService::class)->makePartial();
        $aiService->shouldReceive('getProvider')
                 ->with('gemini')
                 ->andReturn($mockProvider);

        $result = $aiService->processMessage('gemini', 'Hello', ['apiKey' => 'test'], false, []);

        $this->assertTrue($result['success']);
        $this->assertEquals('Hi there!', $result['response']);
    }

    public function test_handles_provider_errors_gracefully(): void
    {
        $mockProvider = Mockery::mock(GeminiService::class);
        $mockProvider->shouldReceive('generateResponse')
                    ->once()
                    ->andThrow(new \Exception('API Error'));

        $aiService = Mockery::mock(AIService::class)->makePartial();
        $aiService->shouldReceive('getProvider')
                 ->with('gemini')
                 ->andReturn($mockProvider);

        $this->expectException(\Exception::class);
        $aiService->processMessage('gemini', 'Hello', ['apiKey' => 'test']);
    }

    public function test_can_test_connection(): void
    {
        $mockProvider = Mockery::mock(GeminiService::class);
        $mockProvider->shouldReceive('testConnection')
                    ->once()
                    ->with(['apiKey' => 'test'])
                    ->andReturn([
                        'success' => true,
                        'message' => 'Connection successful',
                        'provider' => 'gemini',
                    ]);

        $aiService = Mockery::mock(AIService::class)->makePartial();
        $aiService->shouldReceive('getProvider')
                 ->with('gemini')
                 ->andReturn($mockProvider);

        $result = $aiService->testConnection('gemini', ['apiKey' => 'test']);

        $this->assertTrue($result['success']);
        $this->assertEquals('Connection successful', $result['message']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}