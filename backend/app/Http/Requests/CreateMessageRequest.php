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
            'body' => ['nullable', 'string', 'max:2000', 'required_without_all:file,e2ee'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov', 'max:25600', 'required_without_all:body,e2ee'],
            'e2ee' => ['nullable', 'array', 'required_without_all:body,file'],
            'e2ee.v' => ['required_with:e2ee', 'integer', 'in:1'],
            'e2ee.sender_public_key' => [
                'required_with:e2ee',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value)) {
                        $fail('Invalid key.');
                        return;
                    }
                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 32) {
                        $fail('Invalid key.');
                    }
                },
            ],
            'e2ee.ciphertext_sender' => ['required_with:e2ee', 'string', 'max:20000'],
            'e2ee.nonce_sender' => [
                'required_with:e2ee',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value)) {
                        $fail('Invalid nonce.');
                        return;
                    }
                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 24) {
                        $fail('Invalid nonce.');
                    }
                },
            ],
            'e2ee.ciphertext_recipient' => ['required_with:e2ee', 'string', 'max:20000'],
            'e2ee.nonce_recipient' => [
                'required_with:e2ee',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value)) {
                        $fail('Invalid nonce.');
                        return;
                    }
                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 24) {
                        $fail('Invalid nonce.');
                    }
                },
            ],
        ];
    }
}
