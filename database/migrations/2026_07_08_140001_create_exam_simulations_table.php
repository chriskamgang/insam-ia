<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exam_simulations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->integer('duration_minutes')->default(60);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->longText('answers')->nullable(); // Student's written answers
            $table->integer('score')->nullable(); // Score out of 100
            $table->longText('ai_feedback')->nullable(); // AI evaluation feedback in markdown
            $table->json('detailed_scores')->nullable(); // Per-question scores if applicable
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'evaluated'])->default('not_started');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('exam_simulations'); }
};
