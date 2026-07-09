<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Free, Premium, Pro
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('price')->default(0); // Price in FCFA
            $table->enum('billing_cycle', ['monthly', 'yearly', 'lifetime'])->default('monthly');
            $table->json('features'); // Array of feature strings
            $table->json('limits'); // { "ai_chats_per_day": 5, "predictions_per_month": 2, etc. }
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('starts_at');
            $table->timestamp('expires_at')->nullable();
            $table->string('payment_method')->nullable(); // momo, om, card, etc.
            $table->string('payment_reference')->nullable();
            $table->integer('amount_paid')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
    }
};
