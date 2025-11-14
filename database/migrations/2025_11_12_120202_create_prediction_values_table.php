<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('prediction_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prediction_id')->constrained()->onDelete('cascade');
            $table->integer('index');
            $table->float('value');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('prediction_values');
    }
};
