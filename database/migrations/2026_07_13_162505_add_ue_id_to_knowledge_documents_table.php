<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('knowledge_documents', function (Blueprint $table) {
            $table->foreignId('ue_id')->nullable()->after('category_id')
                ->constrained('unites_enseignement')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ue_id');
        });
    }
};
