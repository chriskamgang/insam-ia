<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('revision_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->longText('content'); // Full markdown content of the revision card
            $table->text('summary')->nullable(); // Short summary
            $table->json('key_points')->nullable(); // Array of key points
            $table->enum('status', ['generating', 'completed', 'failed'])->default('generating');
            $table->string('source')->nullable(); // What it was generated from (category name, document title, etc.)
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('revision_cards'); }
};
