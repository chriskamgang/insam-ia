<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('unites_enseignement', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // ex: "Mathematiques", "Comptabilite"
            $table->string('code')->nullable(); // ex: "UE101"
            $table->string('filiere'); // ex: "Gestion", "Informatique", "Sante"
            $table->unsignedTinyInteger('annee')->default(1); // 1, 2, 3 (sante=3 ans, BTS=2 ans)
            $table->unsignedTinyInteger('semestre'); // 1 ou 2
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('coefficient')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Link exams to UE
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('ue_id')->nullable()->after('category_id')
                ->constrained('unites_enseignement')->nullOnDelete();
        });

        // Link user_course_progress to UE
        Schema::table('user_course_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('ue_id')->nullable()->after('subject');
        });
    }

    public function down(): void
    {
        Schema::table('user_course_progress', function (Blueprint $table) {
            $table->dropColumn('ue_id');
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ue_id');
        });
        Schema::dropIfExists('unites_enseignement');
    }
};
