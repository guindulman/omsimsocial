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
        $type = $this->input('type');
        $fileRules = ['required', 'file', 'max:51200'];
        if ($type === 'image') {
            $fileRules[] = 'mimes:jpg,jpeg,png,webp';
        } elseif ($type === 'video') {
            $fileRules[] = 'mimes:mp4,mov';
        } elseif ($type === 'voice') {
            $fileRules[] = 'mimes:m4a,mp3,wav,aac';
        }

        return [
            'type' => ['required', 'in:image,video,voice'],
            'file' => $fileRules,
            'metadata' => ['nullable', 'array'],
        ];
    }
}
