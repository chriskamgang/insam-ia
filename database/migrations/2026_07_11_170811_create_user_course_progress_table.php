<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_course_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // 'bts_exam', 'ue_course', 'ue_quiz', 'bts_quiz'
            $table->string('subject'); // matiere / UE name
            $table->string('title'); // exam or course title
            $table->float('score')->default(0); // 0-100
            $table->integer('total_questions')->nullable();
            $table->integer('correct_answers')->nullable();
            $table->boolean('course_completed')->default(false); // "Terminé" clicked
            $table->boolean('quiz_completed')->default(false);
            $table->json('details')->nullable(); // extra data (quiz answers, etc.)
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_course_progress');
    }
};
