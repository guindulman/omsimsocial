<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMemoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', 'in:circle,direct,private,public,followers,friends,story'],
            'circle_id' => ['nullable', 'integer', 'exists:circles,id', 'required_if:scope,circle'],
            'direct_user_id' => ['nullable', 'integer', 'exists:users,id', 'required_if:scope,direct'],
            'body' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'client_post_id' => ['nullable', 'string', 'max:64'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:users,id'],
        ];
    }
}
