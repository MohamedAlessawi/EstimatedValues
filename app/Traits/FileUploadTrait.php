<?php

namespace App\Traits;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

trait FileUploadTrait
{
    public function handleFileUpload(Request $request, $fileAttribute, $directory)
    {
        if($request->hasFile($fileAttribute)){
            return $request->file($fileAttribute)->store($directory, 'public');
        }
        return null ;
    }

    public function jsonResponse($message, $status=200, $data=[])
    {

        return response()->json(array_merge(["message" => $message], $data), $status);
    }
}
