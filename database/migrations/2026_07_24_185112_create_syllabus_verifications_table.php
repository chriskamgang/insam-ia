<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('syllabus_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('course_title');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('document_id')->nullable();
            $table->longText('syllabus');
            $table->longText('support');
            $table->longText('result');
            $table->integer('score')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('syllabus_verifications');
    }
};
