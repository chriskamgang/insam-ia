<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->string('exam_type')->default('licence')->after('title'); // 'bts' or 'licence'
        });

        // Pivot table for BTS exams that cover multiple UEs
        Schema::create('exam_ue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ue_id')->constrained('unites_enseignement')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['exam_id', 'ue_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_ue');
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('exam_type');
        });
    }
};
