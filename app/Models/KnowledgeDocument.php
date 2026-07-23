<?php
namespace App\Models;

use App\Jobs\ExtractDocumentContent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeDocument extends Model
{
    protected $fillable = [
        'title',
        'filename',
        'content',
        'file_path',
        'type',
        'category_id',
        'ue_id',
    ];

    protected static function booted(): void
    {
        static::saved(function (KnowledgeDocument $doc) {
            // Auto-extract content when a file is uploaded and content is empty
            if ($doc->file_path && $doc->wasChanged('file_path') && !$doc->content) {
                ExtractDocumentContent::dispatch($doc);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function uniteEnseignement(): BelongsTo
    {
        return $this->belongsTo(\App\Models\UniteEnseignement::class, 'ue_id');
    }
}
