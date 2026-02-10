<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $e2ee = null;
        if (! is_null($this->body_e2ee_version)) {
            $e2ee = [
                'v' => (int) $this->body_e2ee_version,
                'sender_public_key' => $this->body_e2ee_sender_public_key,
                'ciphertext_sender' => $this->body_ciphertext_sender,
                'nonce_sender' => $this->body_nonce_sender,
                'ciphertext_recipient' => $this->body_ciphertext_recipient,
                'nonce_recipient' => $this->body_nonce_recipient,
            ];
        }

        return [
            'id' => $this->id,
            'body' => $e2ee ? null : $this->body,
            'e2ee' => $e2ee,
            'media_url' => $this->media_url,
            'media_type' => $this->media_type,
            'read_at' => $this->read_at,
            'sender' => UserResource::make($this->whenLoaded('sender')),
            'recipient' => UserResource::make($this->whenLoaded('recipient')),
            'created_at' => $this->created_at,
        ];
    }
}
