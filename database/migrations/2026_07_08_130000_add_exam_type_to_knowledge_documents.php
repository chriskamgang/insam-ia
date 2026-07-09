<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE knowledge_documents MODIFY COLUMN type ENUM('pdf', 'text', 'course', 'exam')");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE knowledge_documents MODIFY COLUMN type ENUM('pdf', 'text', 'course')");
    }
};
