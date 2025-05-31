<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\Response;

class EncryptApiKeys
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Encrypt API keys in request data before processing
        if ($request->has('api_key') && !empty($request->api_key)) {
            $request->merge([
                'api_key' => $this->encryptIfNotEncrypted($request->api_key)
            ]);
        }

        if ($request->has('apiKey') && !empty($request->apiKey)) {
            $request->merge([
                'apiKey' => $this->encryptIfNotEncrypted($request->apiKey)
            ]);
        }

        return $next($request);
    }

    /**
     * Encrypt the API key if it's not already encrypted.
     */
    protected function encryptIfNotEncrypted(string $apiKey): string
    {
        try {
            // Try to decrypt - if it works, it's already encrypted
            Crypt::decryptString($apiKey);
            return $apiKey;
        } catch (\Exception $e) {
            // If decryption fails, it's not encrypted, so encrypt it
            return Crypt::encryptString($apiKey);
        }
    }
}