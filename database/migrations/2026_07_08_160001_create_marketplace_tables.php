<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('marketplace_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['course', 'notes', 'exercises', 'exam_prep', 'tutorial', 'other'])->default('notes');
            $table->string('matiere')->nullable();
            $table->string('niveau')->nullable();
            $table->integer('price')->default(0); // Price in FCFA, 0 = free
            $table->string('file_path')->nullable();
            $table->string('preview_path')->nullable(); // Preview/sample file
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedInteger('downloads_count')->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->timestamps();
        });

        Schema::create('marketplace_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('marketplace_items')->cascadeOnDelete();
            $table->integer('amount_paid')->default(0);
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamps();
        });

        Schema::create('marketplace_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('marketplace_items')->cascadeOnDelete();
            $table->tinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'item_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('marketplace_reviews');
        Schema::dropIfExists('marketplace_purchases');
        Schema::dropIfExists('marketplace_items');
    }
};
