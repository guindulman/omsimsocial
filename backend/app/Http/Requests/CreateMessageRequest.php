<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $body = $this->input('body');
        if (is_string($body)) {
            $body = trim($body);
        }
        $this->merge([
            'body' => $body === '' ? null : $body,
        ]);
    }

    public function rules(): array
    {
        return [
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'body' => ['nullable', 'string', 'max:2000', 'required_without:file'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov', 'max:25600', 'required_without:body'],
        ];
    }
}
