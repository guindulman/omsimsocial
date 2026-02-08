<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'bio' => ['sometimes', 'nullable', 'string'],
            'avatar_url' => ['sometimes', 'nullable', 'string'],
            'cover_type' => ['sometimes', 'string', 'in:image,gradient'],
            'cover_value' => ['sometimes', 'nullable', 'string'],
            'city' => ['sometimes', 'nullable', 'string'],
            'country' => ['sometimes', 'nullable', 'string'],
            'language' => ['sometimes', 'nullable', 'string'],
            'links' => ['sometimes', 'nullable', 'array'],
            'accent_color' => ['sometimes', 'string', 'in:auto,teal,violet,pink'],
            'layout_style' => ['sometimes', 'string', 'in:minimal,cards,gallery'],
            'pinned_gem_post_ids' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
