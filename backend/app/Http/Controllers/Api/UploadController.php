<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PresignUploadRequest;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function presign(PresignUploadRequest $request)
    {
        $path = 'uploads/'.Str::uuid().'-'.$request->input('file_name');

        return response()->json([
            'upload_url' => 'https://uploads.nodsnap.local/'.$path,
            'public_url' => 'https://cdn.nodsnap.local/'.$path,
            'expires_in' => 900,
        ]);
    }
}
