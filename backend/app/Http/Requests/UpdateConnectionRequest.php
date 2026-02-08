<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'in:friend,family,work,community'],
            'level' => ['nullable', 'in:acquaintance,friend,inner'],
            'muted' => ['nullable', 'boolean'],
        ];
    }
}
