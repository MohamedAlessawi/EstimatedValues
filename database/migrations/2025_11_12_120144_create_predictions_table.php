<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title'); // مثال: "تنبؤ معدل أداء طالب"
            $table->text('description')->nullable();
            $table->string('prediction_type')->nullable(); // مثل "student_performance"
            $table->integer('future_steps')->default(3);
            $table->date('start_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('predictions');
    }
};
