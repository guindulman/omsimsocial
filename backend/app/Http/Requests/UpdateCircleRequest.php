<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCircleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:120'],
            'icon' => ['nullable', 'string', 'max:64'],
            'invite_only' => ['nullable', 'boolean'],
            'prompt_frequency' => ['nullable', 'in:off,daily,weekly'],
        ];
    }
}
