<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LiveRoomStartRequest extends FormRequest
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
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'visibility' => ['sometimes', 'string', 'in:connections,invite,public'],
        ];
    }
}
