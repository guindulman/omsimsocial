<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePostRequest extends FormRequest
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
            'caption' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:vip,public,gem,expired'],
            'visibility_scope' => ['sometimes', 'string', 'in:public,connections,nearby,event'],
            'media' => ['sometimes', 'array'],
            'media.*.type' => ['required_with:media', 'string', 'in:image,video'],
            'media.*.url' => ['required_with:media', 'string'],
            'media.*.thumb_url' => ['sometimes', 'nullable', 'string'],
            'media.*.duration_ms' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'media.*.order_index' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
