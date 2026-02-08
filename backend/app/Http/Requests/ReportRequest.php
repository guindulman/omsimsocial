<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportRequest extends FormRequest
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
            'target_type' => ['required', 'string', 'in:post,memory,comment,user,story,message,live_room'],
            'target_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'details' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
