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
        Schema::table('syllabus_verifications', function (Blueprint $table) {
            $table->foreignId('published_document_id')->nullable()->after('document_id');
            $table->longText('completed_support')->nullable()->after('support');
        });
    }

    public function down(): void
    {
        Schema::table('syllabus_verifications', function (Blueprint $table) {
            $table->dropColumn(['published_document_id', 'completed_support']);
        });
    }
};
