<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nom')->nullable()->after('name');
            $table->string('prenom')->nullable()->after('nom');
            $table->string('telephone')->nullable();
            $table->string('filiere')->nullable();
            $table->enum('role', ['student', 'teacher', 'admin'])->default('student');
            $table->string('avatar')->nullable();
            $table->string('locale', 5)->default('fr');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nom', 'prenom', 'telephone', 'filiere', 'role', 'avatar', 'locale']);
        });
    }
};
