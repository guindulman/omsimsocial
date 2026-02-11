<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $appName }} Data Deletion Request</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h2 style="margin-bottom: 8px;">{{ $appName }} Data Deletion Request</h2>
    <p style="margin-top: 0;"><strong>Request ID:</strong> #{{ $request->id }}</p>

    <p><strong>App:</strong> {{ $request->app_name }}</p>
    <p><strong>Name:</strong> {{ $request->full_name ?: 'N/A' }}</p>
    <p><strong>Email:</strong> {{ $request->email ?: 'N/A' }}</p>
    <p><strong>Username:</strong> {{ $request->username ?: 'N/A' }}</p>
    <p><strong>Request types:</strong> {{ implode(', ', $request->request_types ?? []) }}</p>
    <p><strong>Details:</strong><br>{{ $request->details ?: 'N/A' }}</p>
    <p><strong>IP:</strong> {{ $request->ip_address ?: 'N/A' }}</p>
    <p><strong>User-Agent:</strong><br>{{ $request->user_agent ?: 'N/A' }}</p>
    <p><strong>Created at:</strong> {{ optional($request->created_at)->toDateTimeString() }}</p>
</body>
</html>

