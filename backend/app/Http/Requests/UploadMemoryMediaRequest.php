<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMemoryMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:image,video,voice'],
            'file' => ['required', 'file', 'max:51200'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
