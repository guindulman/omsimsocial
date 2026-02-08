<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateConnectionInviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'method' => ['nullable', 'in:invite,event'],
            'type' => ['nullable', 'in:friend,family,work,community'],
            'level' => ['nullable', 'in:acquaintance,friend,inner'],
        ];
    }
}
