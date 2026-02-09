<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\BlockController;
use App\Http\Controllers\Api\V1\CallController;
use App\Http\Controllers\Api\V1\CircleController;
use App\Http\Controllers\Api\V1\ConnectionController;
use App\Http\Controllers\Api\V1\ConnectRequestController;
use App\Http\Controllers\Api\V1\FeedPreferenceController;
use App\Http\Controllers\Api\V1\FollowController;
use App\Http\Controllers\Api\V1\FollowRequestController;
use App\Http\Controllers\Api\V1\FriendRequestController;
use App\Http\Controllers\Api\V1\FriendshipController;
use App\Http\Controllers\Api\V1\HomeFeedController;
use App\Http\Controllers\Api\V1\InboxController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\MemoryCommentController;
use App\Http\Controllers\Api\V1\MemoryController;
use App\Http\Controllers\Api\V1\MemoryReshareController;
use App\Http\Controllers\Api\V1\ProfileSettingsController;
use App\Http\Controllers\Api\V1\ProfileViewController;
use App\Http\Controllers\Api\V1\ProfileFeedController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\SafetyController;
use App\Http\Controllers\Api\V1\TimeCapsuleController;
use App\Http\Controllers\Api\V1\VaultController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes(['middleware' => ['auth:sanctum']]);
require base_path('routes/channels.php');

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        // Auth endpoints are prime targets for abuse; keep them rate-limited.
        Route::get('anti-bot', [AuthController::class, 'antiBot']);
        Route::get('turnstile', [AuthController::class, 'turnstile']);
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
        });

        Route::get('me', [AuthController::class, 'me']);
        Route::patch('account/settings', [AccountController::class, 'updateSettings']);

        Route::middleware('active')->group(function () {
            Route::patch('account/profile', [AccountController::class, 'updateProfile']);
            Route::patch('account/password', [AccountController::class, 'updatePassword']);
            Route::post('account/avatar', [AccountController::class, 'uploadAvatar']);
            Route::post('account/cover', [AccountController::class, 'uploadCover']);

            Route::post('follow/{user}', [FollowController::class, 'store']);
            Route::delete('follow/{user}', [FollowController::class, 'destroy']);
            Route::get('users/{user}/followers', [FollowController::class, 'followers']);
            Route::get('users/{user}/following', [FollowController::class, 'following']);

            Route::prefix('follow-requests')->group(function () {
                Route::get('incoming', [FollowRequestController::class, 'incoming']);
                Route::get('outgoing', [FollowRequestController::class, 'outgoing']);
                Route::post('{id}/accept', [FollowRequestController::class, 'accept']);
                Route::post('{id}/decline', [FollowRequestController::class, 'decline']);
                Route::post('{id}/cancel', [FollowRequestController::class, 'cancel']);
            });

            Route::prefix('friend-requests')->group(function () {
                Route::post('/', [FriendRequestController::class, 'store']);
                Route::get('incoming', [FriendRequestController::class, 'incoming']);
                Route::get('outgoing', [FriendRequestController::class, 'outgoing']);
                Route::post('{id}/confirm', [FriendRequestController::class, 'confirm']);
                Route::post('{id}/decline', [FriendRequestController::class, 'decline']);
                Route::post('{id}/cancel', [FriendRequestController::class, 'cancel']);
            });

            Route::get('friends', [FriendshipController::class, 'index']);
            Route::delete('friends/{user}', [FriendshipController::class, 'destroy']);
            Route::post('friends/{user}/verify', [FriendshipController::class, 'verify']);

            Route::prefix('connect/requests')->group(function () {
                Route::post('/', [ConnectRequestController::class, 'store']);
                Route::get('incoming', [ConnectRequestController::class, 'incoming']);
                Route::get('outgoing', [ConnectRequestController::class, 'outgoing']);
                Route::post('{id}/accept', [ConnectRequestController::class, 'accept']);
                Route::post('{id}/decline', [ConnectRequestController::class, 'decline']);
                Route::post('{id}/cancel', [ConnectRequestController::class, 'cancel']);
            });

            Route::prefix('connections')->group(function () {
                Route::post('invite', [ConnectionController::class, 'invite'])->middleware('throttle:invites');
                Route::post('accept-invite', [ConnectionController::class, 'acceptInvite']);
                Route::post('handshake/initiate', [ConnectionController::class, 'initiateHandshake']);
                Route::post('handshake/confirm', [ConnectionController::class, 'confirmHandshake']);
                Route::get('/', [ConnectionController::class, 'index']);
                Route::patch('{connection}', [ConnectionController::class, 'update']);
                Route::post('{connection}/block', [ConnectionController::class, 'block']);
            });

            Route::prefix('blocks')->withoutMiddleware(\App\Http\Middleware\EnsureNotBlocked::class)->group(function () {
                Route::get('/', [BlockController::class, 'index']);
                Route::post('/', [BlockController::class, 'store']);
                Route::get('{blockedUser}', [BlockController::class, 'status']);
                Route::delete('{blockedUser}', [BlockController::class, 'destroy']);
            });

            Route::prefix('circles')->group(function () {
                Route::post('/', [CircleController::class, 'store']);
                Route::get('/', [CircleController::class, 'index']);
                Route::get('{circle}', [CircleController::class, 'show']);
                Route::post('{circle}/members', [CircleController::class, 'addMember']);
                Route::delete('{circle}/members/{userId}', [CircleController::class, 'removeMember']);
                Route::patch('{circle}', [CircleController::class, 'update']);
                Route::post('{circle}/prompts', [CircleController::class, 'createPrompt']);
                Route::get('{circle}/feed', [CircleController::class, 'feed']);
            });

            Route::prefix('memories')->group(function () {
                Route::post('/', [MemoryController::class, 'store'])->middleware('throttle:posts');
                Route::get('public', [MemoryController::class, 'publicFeed']);
                Route::get('following', [MemoryController::class, 'followingFeed']);
                Route::get('connections', [MemoryController::class, 'connectionsFeed']);
                Route::get('{memory}/comments', [MemoryCommentController::class, 'index']);
                Route::post('{memory}/comments', [MemoryCommentController::class, 'store'])->middleware('throttle:10,1');
                Route::get('mine', [MemoryController::class, 'mine']);
                Route::get('hidden', [FeedPreferenceController::class, 'hidden']);
                Route::get('trash', [MemoryController::class, 'trash']);
                Route::post('{memory}/restore', [MemoryController::class, 'restore']);
                Route::delete('{memory}/purge', [MemoryController::class, 'purge']);
                Route::post('{memory}/story-view', [MemoryController::class, 'viewStory']);
                Route::get('{memory}/story-viewers', [MemoryController::class, 'storyViewers']);
                Route::get('{memory}', [MemoryController::class, 'show']);
                Route::delete('{memory}', [MemoryController::class, 'destroy']);
                Route::post('{memory}/media', [MemoryController::class, 'addMedia']);
                Route::post('{memory}/react', [MemoryController::class, 'react'])->middleware('throttle:reactions');
                Route::delete('{memory}/react', [MemoryController::class, 'unreact'])->middleware('throttle:reactions');
                Route::post('{memory}/adopt', [MemoryController::class, 'adopt'])->middleware('throttle:60,1');
                Route::get('{memory}/adoptions', [MemoryController::class, 'adoptions']);
                Route::get('{memory}/hearts', [MemoryController::class, 'hearts']);
                Route::post('{memory}/reshare', [MemoryController::class, 'reshare'])->middleware('throttle:30,1');
                Route::delete('{memory}/reshare', [MemoryController::class, 'unreshare'])->middleware('throttle:30,1');
                Route::get('{memory}/reshares', [MemoryReshareController::class, 'index']);
                Route::post('{memory}/save', [MemoryController::class, 'adopt'])->middleware('throttle:60,1');
                Route::delete('{memory}/save', [MemoryController::class, 'unsave'])->middleware('throttle:60,1');
                Route::get('{memory}/savers', [MemoryController::class, 'adoptions']);
            });

            Route::post('memories/{memory}/hide', [FeedPreferenceController::class, 'hide'])->middleware('throttle:30,1');
            Route::delete('memories/{memory}/hide', [FeedPreferenceController::class, 'unhide'])->middleware('throttle:30,1');
            Route::post('users/{user}/mute', [FeedPreferenceController::class, 'mute'])->middleware('throttle:30,1');
            Route::delete('users/{user}/mute', [FeedPreferenceController::class, 'unmute'])->middleware('throttle:30,1');
            Route::get('users/{user}/profile-feed', [ProfileFeedController::class, 'show']);

            Route::prefix('profile')->group(function () {
                Route::get('views/summary', [ProfileViewController::class, 'summary']);
                Route::get('views', [ProfileViewController::class, 'index']);
                Route::post('views/{user}', [ProfileViewController::class, 'store']);
                Route::get('settings', [ProfileSettingsController::class, 'show']);
                Route::patch('settings', [ProfileSettingsController::class, 'update']);
            });

            Route::get('feed/home', [HomeFeedController::class, 'index']);
            Route::get('search', [SearchController::class, 'search']);
            Route::get('search/suggested-accounts', [SearchController::class, 'suggestedAccounts']);
            Route::get('search/trending', [SearchController::class, 'trending']);

            Route::patch('comments/{comment}', [MemoryCommentController::class, 'update'])->middleware('throttle:10,1');
            Route::post('comments/{comment}/like', [MemoryCommentController::class, 'like'])->middleware('throttle:30,1');
            Route::delete('comments/{comment}/like', [MemoryCommentController::class, 'unlike'])->middleware('throttle:30,1');
            Route::get('comments/{comment}/likes', [MemoryCommentController::class, 'likes']);
            Route::delete('comments/{comment}', [MemoryCommentController::class, 'destroy'])->middleware('throttle:30,1');

            Route::prefix('vault')->group(function () {
                Route::get('/', [VaultController::class, 'index']);
                Route::get('adopted', [VaultController::class, 'adopted']);
                Route::get('on-this-day', [VaultController::class, 'onThisDay']);
            });

            Route::post('time-capsules', [TimeCapsuleController::class, 'store']);
            Route::get('time-capsules', [TimeCapsuleController::class, 'index']);
            Route::get('time-capsules/{timeCapsule}', [TimeCapsuleController::class, 'show']);

            Route::get('inbox/adoption-notes', [InboxController::class, 'adoptionNotes']);
            Route::get('inbox/activity', [InboxController::class, 'activity']);
            Route::get('inbox/requests', [InboxController::class, 'requests']);
            Route::get('inbox/unread-count', [InboxController::class, 'unreadCount']);
            Route::post('inbox/activity/read', [InboxController::class, 'markActivityRead']);
            Route::post('inbox/activity/{event}/read', [InboxController::class, 'markEventRead']);

            Route::post('report', [SafetyController::class, 'report'])->middleware('throttle:5,1');

            Route::prefix('calls')->group(function () {
                Route::post('request', [CallController::class, 'request']);
                Route::post('{call}/accept', [CallController::class, 'accept']);
                Route::post('{call}/decline', [CallController::class, 'decline']);
                Route::post('{call}/end', [CallController::class, 'end']);
                Route::post('{call}/signal', [CallController::class, 'signal']);
            });

            Route::post('messages', [MessageController::class, 'store'])->middleware('throttle:messages');
            Route::get('messages/unread-count', [MessageController::class, 'unreadCount']);
            Route::get('messages/unread-by-sender', [MessageController::class, 'unreadBySender']);
            Route::get('messages/thread/{user}', [MessageController::class, 'thread']);
            Route::delete('messages/{message}', [MessageController::class, 'destroy']);
            Route::delete('messages/{message}/unsend', [MessageController::class, 'unsend']);
        });
    });
});
