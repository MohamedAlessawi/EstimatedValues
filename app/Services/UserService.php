<?php

namespace App\Services;

use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Traits\FileUploadTrait; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserService
{
    use ApiResponseTrait;
    use FileUploadTrait;


    protected function transformUser(User $user): array
    {
        // $photoPath = $user->profile_photo;
        $rawPhoto = $user->profile_photo;

        if (is_array($rawPhoto)) {
            $photoPath = null;
        } elseif (is_string($rawPhoto) && $rawPhoto !== '') {
            $photoPath = $rawPhoto;
        } else {
            $photoPath = null;
        }

        $photoUrl  = $photoPath ? asset('storage/' . $photoPath) : null;

        return [
            'id'               => $user->id,
            'full_name'        => $user->full_name,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'profile_photo'=> $photoUrl,
            'created_at'       => $user->created_at,
            'updated_at'       => $user->updated_at,
        ];
    }


    public function getProfile(User $user)
    {
        $data = $this->transformUser($user);

        return $this->unifiedResponse(true, 'User profile retrieved successfully', $data);
    }

    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone'     => 'sometimes|string|max:50|unique:users,phone,' . $user->id,
            'password'  => 'sometimes|confirmed|min:8',

            'profile_photo' => 'prohibited',

        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                $validator->errors(),
                422
            );
        }

        $data = $validator->validated();

        if (isset($data['full_name'])) {
            $user->full_name = $data['full_name'];
        }

        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }

        if (isset($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        $transformed = $this->transformUser($user);

        return $this->unifiedResponse(true, 'User profile updated successfully', $transformed);
    }

    public function updatePhoto(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(
                false,
                'Validation error',
                [],
                $validator->errors(),
                422
            );
        }

        if ($user->profile_photo && is_string($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $file = $request->file('photo');

        $path = $file->store('profile_photos', 'public');

        $user->profile_photo = $path;
        $user->save();

        $transformed = $this->transformUser($user);

        return $this->unifiedResponse(true, 'Profile photo updated successfully', $transformed);
    }


    public function deletePhoto(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->profile_photo && is_string($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
            $user->profile_photo = null;
            $user->save();
        }

        $transformed = $this->transformUser($user);

        return $this->unifiedResponse(true, 'Profile photo removed successfully', $transformed);
    }
}
