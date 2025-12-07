<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->string('scope_type')->default('college')->after('user_id');
            $table->foreignId('scope_id')->nullable()->after('scope_type')
                ->constrained('colleges')->nullOnDelete();

            $table->string('metric')->default('revenue')->after('title');
            $table->string('period_type')->default('yearly')->after('metric');

            $table->text('description')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropForeign(['scope_id']);
            $table->dropColumn(['scope_type', 'scope_id', 'metric', 'period_type']);
        });
    }
};
