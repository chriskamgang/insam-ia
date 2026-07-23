<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('roadmap_steps', function (Blueprint $table) {
            $table->json('ai_details')->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('roadmap_steps', function (Blueprint $table) {
            $table->dropColumn('ai_details');
        });
    }
};
