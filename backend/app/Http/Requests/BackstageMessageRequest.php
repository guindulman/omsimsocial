<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BackstageMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string'],
            'media_url' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
