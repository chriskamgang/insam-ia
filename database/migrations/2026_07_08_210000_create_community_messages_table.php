<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('channel'); // e.g. "gl-L1", "reseaux-L2"
            $table->text('content');
            $table->string('type')->default('text'); // text, image
            $table->foreignId('parent_id')->nullable()->constrained('community_messages')->nullOnDelete();
            $table->timestamps();

            $table->index(['channel', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_messages');
    }
};
