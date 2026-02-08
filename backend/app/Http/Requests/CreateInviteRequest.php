<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInviteRequest extends FormRequest
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
            'max_uses' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'expires_at' => ['sometimes', 'date'],
        ];
    }
}
