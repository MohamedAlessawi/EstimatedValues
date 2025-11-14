<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'profile_photo',
        'password',
        'ip_address',
        'two_factor_enabled',
    ];




    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
    ];


        public function userRoles()
    {
        return $this->hasMany(UserRole::class, 'user_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'booked_by');
    }

    public function medicalFiles()
    {
        return $this->hasMany(MedicalFile::class, 'user_id');
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    public function licenses()
    {
        return $this->hasMany(License::class, 'user_id');
    }

    public function doctors()
    {
        return $this->hasOne(Doctor::class, 'user_id');
    }

    public function adminCenters()
    {
        return $this->hasMany(AdminCenter::class, 'user_id');
    }

    public function secretaries()
    {
        return $this->hasMany(Secretary::class, 'user_id');
    }

    public function userCenters()
    {
        return $this->hasMany(UserCenter::class, 'user_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'generated_by');
    }
}
