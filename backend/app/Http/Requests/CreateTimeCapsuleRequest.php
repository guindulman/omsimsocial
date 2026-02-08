<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTimeCapsuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unlock_at' => ['required', 'date'],
            'scope' => ['nullable', 'in:private,circle,direct'],
            'circle_id' => ['nullable', 'integer', 'exists:circles,id', 'required_if:scope,circle'],
            'direct_user_id' => ['nullable', 'integer', 'exists:users,id', 'required_if:scope,direct'],
            'title' => ['nullable', 'string', 'max:140'],
            'memory_ids' => ['required', 'array', 'min:1'],
            'memory_ids.*' => ['integer', 'exists:memories,id'],
        ];
    }
}
