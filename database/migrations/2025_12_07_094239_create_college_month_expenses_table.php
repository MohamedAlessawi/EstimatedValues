<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('college_month_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('college_id')->constrained('colleges')->onDelete('cascade');
            $table->integer('year');
            $table->tinyInteger('month'); // 1-12
            $table->decimal('expenses', 15, 2);
            $table->string('description')->nullable(); // ✅ what is this expense
            $table->timestamps();

            // No unique constraint here (we will sum per month when building the series)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('college_month_expenses');
    }
};
