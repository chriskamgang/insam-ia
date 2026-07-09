<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('filiere')->nullable();
            $table->string('matiere')->nullable();
            $table->string('niveau')->nullable();
            $table->string('annee')->nullable();
            $table->string('file_path');
            $table->string('correction_path')->nullable();
            $table->boolean('is_corrected')->default(false);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('source', ['admin', 'student'])->default('admin');
            $table->unsignedInteger('downloads_count')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('exams'); }
};
