<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallSignalSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public int $callId;
    public int $fromUserId;
    public int $toUserId;
    public string $event;
    /**
     * @var array<string, mixed>
     */
    public array $data;

    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(int $callId, int $fromUserId, int $toUserId, string $event, array $data = [])
    {
        $this->callId = $callId;
        $this->fromUserId = $fromUserId;
        $this->toUserId = $toUserId;
        $this->event = $event;
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->fromUserId),
            new PrivateChannel('user.'.$this->toUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'call.signal';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'call_id' => $this->callId,
            'event' => $this->event,
            'from_user_id' => $this->fromUserId,
            'to_user_id' => $this->toUserId,
            'data' => $this->data,
        ];
    }
}
