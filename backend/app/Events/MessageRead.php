<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public int $readerId,
        public int $otherUserId,
        public ?int $conversationId,
        public array $messageIds,
        public string $readAt,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->readerId),
            new PrivateChannel('user.'.$this->otherUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }

    public function broadcastWith(): array
    {
        return [
            'reader_id' => $this->readerId,
            'conversation_id' => $this->conversationId,
            'message_ids' => $this->messageIds,
            'read_at' => $this->readAt,
        ];
    }
}
