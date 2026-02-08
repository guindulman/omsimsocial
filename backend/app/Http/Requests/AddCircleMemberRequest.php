<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddCircleMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['nullable', 'in:admin,member'],
        ];
    }
}
