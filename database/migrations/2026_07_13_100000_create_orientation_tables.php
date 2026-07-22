<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ecoles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('ville')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('site_web')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ecole_id')->constrained('ecoles')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('specialites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('diplome')->nullable();
            $table->string('duree')->nullable();
            $table->text('avantages')->nullable();
            $table->text('debouches')->nullable();
            $table->text('competences')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('orientation_questions', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['filiere', 'specialite']);
            $table->foreignId('ecole_id')->nullable()->constrained('ecoles')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();
            $table->string('question');
            $table->json('options');
            $table->json('scores');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orientation_questions');
        Schema::dropIfExists('specialites');
        Schema::dropIfExists('filieres');
        Schema::dropIfExists('ecoles');
    }
};
