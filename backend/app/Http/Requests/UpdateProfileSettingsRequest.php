<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileSettingsRequest extends FormRequest
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
            'profile_visibility' => ['sometimes', 'string', 'in:public,connections'],
            'share_profile_views' => ['sometimes', 'boolean'],
            'show_city' => ['sometimes', 'boolean'],
            'show_links' => ['sometimes', 'boolean'],
            'allow_invites_from' => ['sometimes', 'string', 'in:everyone,mutuals,nobody'],
            'allow_calls_from' => ['sometimes', 'string', 'in:connections,favorites,nobody'],
        ];
    }
}
