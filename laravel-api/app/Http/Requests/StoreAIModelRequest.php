<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreAIModelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ai_provider_id' => 'nullable|exists:a_i_providers,id',
            'name' => 'required|string|max:255',
            'model_id' => 'required|string|max:255',
            'provider_type' => 'required|string|max:50',
            'description' => 'nullable|string',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'capabilities' => 'nullable|array',
            'configuration' => 'nullable|array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'ai_provider_id.exists' => 'The selected AI provider does not exist.',
            'name.required' => 'The model name is required.',
            'model_id.required' => 'The model identifier is required.',
            'provider_type.required' => 'The provider type is required.',
            'temperature.numeric' => 'Temperature must be a number between 0 and 2.',
            'max_tokens.integer' => 'Max tokens must be a whole number between 1 and 32000.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => Auth::id(),
        ]);
    }
}