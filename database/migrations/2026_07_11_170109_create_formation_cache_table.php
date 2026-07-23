<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formation_cache', function (Blueprint $table) {
            $table->id();
            $table->string('api_slug');
            $table->json('data');
            $table->timestamp('fetched_at');
            $table->timestamps();

            $table->index('api_slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formation_cache');
    }
};
