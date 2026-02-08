<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProfileViewRequest extends FormRequest
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
            'viewer_visibility' => ['sometimes', 'string', 'in:named,anonymous'],
            'source' => ['required', 'string', 'in:fresh,last_call,gems,search,invite,nearby,profile_link'],
        ];
    }
}
