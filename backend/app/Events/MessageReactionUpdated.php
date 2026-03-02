<?php

namespace App\Events;

use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public Message $message,
        public ?MessageReaction $reaction,
        public string $action,
        public int $actorId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->message->sender_id),
            new PrivateChannel('user.'.$this->message->recipient_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.reaction';
    }

    public function broadcastWith(): array
    {
        $reactionSummary = $this->message->reactions()
            ->select('reaction')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('reaction')
            ->orderByDesc('count')
            ->get()
            ->map(fn (MessageReaction $item) => [
                'reaction' => $item->reaction,
                'count' => (int) $item->count,
            ])
            ->values();

        return [
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'action' => $this->action,
            'actor_id' => $this->actorId,
            'reaction' => $this->reaction?->reaction,
            'reactions' => $reactionSummary,
        ];
    }
}
