<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('college_year_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('college_id')->constrained('colleges')->onDelete('cascade');
            $table->integer('year'); // e.g. 2024
            $table->decimal('annual_revenue', 15, 2)->nullable();
            $table->integer('annual_students')->nullable();
            $table->timestamps();

            $table->unique(['college_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('college_year_stats');
    }
};
