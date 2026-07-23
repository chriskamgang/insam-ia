<?php

namespace App\Jobs;

use App\Models\KnowledgeDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ExtractDocumentContent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public KnowledgeDocument $document) {}

    public function handle(): void
    {
        $path = $this->document->file_path;
        if (!$path) return;

        $fullPath = Storage::disk('public')->path($path);
        if (!file_exists($fullPath)) return;

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $content = '';

        try {
            if ($ext === 'pdf') {
                $content = $this->extractPdf($fullPath);
            } elseif (in_array($ext, ['doc', 'docx', 'odt'])) {
                $content = $this->extractDoc($fullPath);
            } elseif (in_array($ext, ['txt', 'md', 'csv'])) {
                $content = file_get_contents($fullPath);
            } elseif (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $content = '[Image: ' . basename($fullPath) . '] ' . ($this->document->title ?? '');
            } elseif (in_array($ext, ['ppt', 'pptx', 'xls', 'xlsx'])) {
                $content = $this->extractDoc($fullPath);
            }
        } catch (\Throwable $e) {
            $content = '[Extraction echouee: ' . $e->getMessage() . ']';
        }

        if ($content) {
            $this->document->update([
                'content' => mb_substr(trim($content), 0, 50000),
                'type' => $ext,
            ]);
        }
    }

    private function extractPdf(string $path): string
    {
        $output = [];
        exec(sprintf('pdftotext -layout %s - 2>/dev/null', escapeshellarg($path)), $output);
        return implode("\n", $output);
    }

    private function extractDoc(string $path): string
    {
        $tmpDir = sys_get_temp_dir() . '/extract_' . md5($path);
        @mkdir($tmpDir, 0755, true);

        // Convert to txt via LibreOffice
        $cmd = sprintf(
            'HOME=/var/www libreoffice --headless --convert-to txt:Text --outdir %s %s 2>&1',
            escapeshellarg($tmpDir),
            escapeshellarg($path)
        );
        exec($cmd, $output, $returnCode);

        $baseName = pathinfo($path, PATHINFO_FILENAME) . '.txt';
        $txtFile = $tmpDir . '/' . $baseName;

        $content = '';
        if (file_exists($txtFile)) {
            $content = file_get_contents($txtFile);
            @unlink($txtFile);
        }
        @array_map('unlink', glob("$tmpDir/*"));
        @rmdir($tmpDir);

        return $content;
    }
}
