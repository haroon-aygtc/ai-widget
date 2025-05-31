<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\AIModel;

class UpdateAIModelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $model = AIModel::find($this->route('ai_model'));
        return Auth::check() && $model && $model->user_id === Auth::id();
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
            'name' => 'sometimes|string|max:255',
            'model_id' => 'sometimes|string|max:255',
            'provider_type' => 'sometimes|string|max:50',
            'description' => 'nullable|string',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'capabilities' => 'nullable|array',
            'configuration' => 'nullable|array',
            'performance_metrics' => 'nullable|array',
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
            'temperature.numeric' => 'Temperature must be a number between 0 and 2.',
            'max_tokens.integer' => 'Max tokens must be a whole number between 1 and 32000.',
        ];
    }
}