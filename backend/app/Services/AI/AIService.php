<?php

namespace App\Services\AI;

class AIService
{
    protected $providers = [
        'openai' => OpenAIService::class,
        'gemini' => GeminiService::class,
        'claude' => ClaudeService::class,
        'mistral' => MistralService::class,
    ];

    /**
     * Get the appropriate AI service based on provider
     *
     * @param string $provider
     * @return mixed
     */
    public function getProvider(string $provider)
    {
        if (!isset($this->providers[$provider])) {
            throw new \Exception("AI provider '{$provider}' not supported");
        }

        $providerClass = $this->providers[$provider];
        return new $providerClass();
    }

    /**
     * Process a chat message using the specified provider
     *
     * @param string $provider
     * @param string $message
     * @param array $config
     * @return array
     */
    public function processMessage(string $provider, string $message, array $config = [])
    {
        $providerService = $this->getProvider($provider);
        return $providerService->generateResponse($message, $config);
    }
}
