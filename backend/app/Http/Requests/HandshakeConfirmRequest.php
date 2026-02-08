<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HandshakeConfirmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64'],
            'type' => ['nullable', 'in:friend,family,work,community'],
            'level' => ['nullable', 'in:acquaintance,friend,inner'],
        ];
    }
}
