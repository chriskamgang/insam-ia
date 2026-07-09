<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quiz_results', function (Blueprint $table) {
            $table->longText('ai_feedback')->nullable()->after('answers');
            $table->json('corrections')->nullable()->after('ai_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_results', function (Blueprint $table) {
            $table->dropColumn(['ai_feedback', 'corrections']);
        });
    }
};
