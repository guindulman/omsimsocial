<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdoptRequest extends FormRequest
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
            'adoption_type' => ['required', 'string', 'in:continue,upgrade,translate,localize'],
            'contribution_text' => ['sometimes', 'nullable', 'string'],
            'parent_adoption_id' => ['sometimes', 'nullable', 'exists:adoptions,id'],
        ];
    }
}
