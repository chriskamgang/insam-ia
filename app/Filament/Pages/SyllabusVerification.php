<?php

namespace App\Filament\Pages;

use App\Models\Category;
use App\Models\KnowledgeDocument;
use App\Models\SyllabusVerification as SyllabusVerificationModel;
use App\Services\AiService;
use BackedEnum;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Auth;
use Livewire\WithFileUploads;

class SyllabusVerification extends Page implements HasForms
{
    use InteractsWithForms, WithFileUploads;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentCheck;
    protected static ?string $navigationLabel = 'Verification Syllabus';
    protected static ?string $title = 'Verification de conformite';
    protected static ?int $navigationSort = 90;
    protected static \UnitEnum|string|null $navigationGroup = 'Outils IA';

    public static function canAccess(): bool
    {
        return Auth::check() && in_array(Auth::user()->role, ['admin', 'enseignant']);
    }

    protected string $view = 'filament.pages.syllabus-verification';

    public ?string $selectedCategory = null;
    public ?string $selectedDocument = null;
    public string $syllabus = '';
    public string $support = '';
    public string $courseTitle = '';
    public string $result = '';
    public string $completedSupport = '';
    public bool $loading = false;
    public string $loadingStep = '';
    public ?int $viewingHistoryId = null;
    public $supportFile = null;
    public $syllabusFile = null;

    protected $queryString = ['doc'];
    public ?string $doc = null;

    public function mount(): void
    {
        if ($this->doc) {
            $document = KnowledgeDocument::find($this->doc);
            if ($document) {
                $this->selectedCategory = $document->category_id ? (string) $document->category_id : null;
                $this->selectedDocument = (string) $document->id;
                $this->syllabus = $document->content ?? '';
                $this->courseTitle = $document->title ?? '';
            }
        }
    }

    public function getDocumentsProperty(): array
    {
        if (!$this->selectedCategory) return [];
        return KnowledgeDocument::where('category_id', $this->selectedCategory)
            ->pluck('title', 'id')->toArray();
    }

    public function getHistoryProperty()
    {
        return SyllabusVerificationModel::with('category:id,name')
            ->latest()->limit(20)->get();
    }

    public function updatedSelectedCategory(): void
    {
        $this->selectedDocument = null;
        $this->syllabus = '';
        $this->courseTitle = '';
    }

    public function updatedSelectedDocument(): void
    {
        if (!$this->selectedDocument) return;
        $doc = KnowledgeDocument::find($this->selectedDocument);
        if ($doc) {
            $this->syllabus = $doc->content ?? '';
            $this->courseTitle = $doc->title ?? '';
        }
    }

    public function loadHistory(int $id): void
    {
        $record = SyllabusVerificationModel::find($id);
        if (!$record) return;
        $this->courseTitle = $record->course_title;
        $this->syllabus = $record->syllabus;
        $this->support = $record->support;
        $this->completedSupport = $record->completed_support ?? '';
        $this->result = $record->result;
        $this->selectedCategory = $record->category_id ? (string) $record->category_id : null;
        $this->selectedDocument = $record->document_id ? (string) $record->document_id : null;
        $this->viewingHistoryId = $id;
    }

    public function deleteHistory(int $id): void
    {
        SyllabusVerificationModel::where('id', $id)->delete();
        if ($this->viewingHistoryId === $id) {
            $this->reset(['result', 'completedSupport', 'viewingHistoryId']);
        }
        Notification::make()->title('Verification supprimee')->success()->send();
    }

    // ─── File uploads ────────────────────────────────────────────

    public function updatedSyllabusFile(): void
    {
        $text = $this->extractFile($this->syllabusFile);
        if ($text) {
            $this->syllabus = $text;
            Notification::make()->title('Syllabus importe')->body(number_format(strlen($text)) . ' caracteres extraits.')->success()->send();
        } else {
            Notification::make()->title('Extraction echouee')->body('Collez le syllabus manuellement.')->warning()->send();
        }
        $this->syllabusFile = null;
    }

    public function updatedSupportFile(): void
    {
        $text = $this->extractFile($this->supportFile);
        if ($text) {
            $this->support = $text;
            Notification::make()->title('Support importe')->body(number_format(strlen($text)) . ' caracteres extraits.')->success()->send();
        } else {
            Notification::make()->title('Extraction echouee')->body('Collez le support manuellement.')->warning()->send();
        }
        $this->supportFile = null;
    }

    private function extractFile($file): string
    {
        if (!$file) return '';
        $ext = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();
        try {
            return match ($ext) {
                'txt'  => trim(file_get_contents($path)),
                'docx' => $this->extractDocxText($path),
                'doc'  => $this->extractDocText($path),
                'pdf'  => $this->extractPdfText($path),
                default => '',
            };
        } catch (\Throwable $e) {
            return '';
        }
    }

    private function extractDocxText(string $path): string
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) return '';
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if (!$xml) return '';
        $xml = str_replace('</w:p>', "\n", $xml);
        $xml = str_replace('</w:tr>', "\n", $xml);
        $text = strip_tags($xml);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }

    private function extractDocText(string $path): string
    {
        exec("antiword " . escapeshellarg($path) . " 2>/dev/null", $output, $code);
        if ($code === 0 && !empty($output)) return implode("\n", $output);
        $tmpDir = sys_get_temp_dir() . '/lo_' . uniqid();
        @mkdir($tmpDir, 0755, true);
        exec("HOME=/tmp libreoffice --headless --convert-to txt --outdir " . escapeshellarg($tmpDir) . " " . escapeshellarg($path) . " 2>&1", $out2, $code2);
        $files = glob("$tmpDir/*.txt");
        $text = !empty($files) ? file_get_contents($files[0]) : '';
        @array_map('unlink', glob("$tmpDir/*"));
        @rmdir($tmpDir);
        return $text;
    }

    private function extractPdfText(string $path): string
    {
        $out = tempnam(sys_get_temp_dir(), 'pdf_') . '.txt';
        exec("pdftotext " . escapeshellarg($path) . " " . escapeshellarg($out) . " 2>/dev/null", $o, $code);
        if ($code === 0 && file_exists($out)) {
            $text = file_get_contents($out);
            @unlink($out);
            return $text;
        }
        @unlink($out);
        return '';
    }

    // ─── Main verification ────────────────────────────────────────

    public function verify(): void
    {
        if (strlen(trim($this->syllabus)) < 10) {
            Notification::make()->title('Syllabus manquant')->danger()->send(); return;
        }
        if (strlen(trim($this->support)) < 10) {
            Notification::make()->title('Support manquant')->danger()->send(); return;
        }

        $this->loading = true;
        $this->completedSupport = '';
        $this->viewingHistoryId = null;
        $title = $this->courseTitle ?: 'ce cours';

        // Step 1: Analyse conformity
        $this->loadingStep = 'Analyse de conformite...';
        $analysisPrompt = <<<PROMPT
Compare le syllabus ministeriel avec le support de cours pour "{$title}".

**SYLLABUS MINISTERIEL:**
{$this->syllabus}

**SUPPORT DE COURS:**
{$this->support}

Commence EXACTEMENT par:
## VERDICT: [CONFORME / PARTIELLEMENT CONFORME / NON CONFORME]
## Score de conformite: XX%

Puis:
1. **Resume executif** (2-3 phrases directes)
2. **Tableau de conformite**: | Point du syllabus | Statut | Couverture | Remarque | (Statut: ✅ Complet, ⚠️ Partiel, ❌ Absent)
3. **Points manquants (❌)** avec importance
4. **Points partiels (⚠️)** avec ce qui manque
5. **Recommandations** classees URGENT / IMPORTANT / SOUHAITABLE

Criteres: CONFORME>=80%, PARTIELLEMENT CONFORME 50-79%, NON CONFORME<50%
PROMPT;

        $this->result = AiService::chat(
            "Tu es expert en conformite pedagogique au Cameroun. Reponds en francais. Markdown avec tableaux.",
            $analysisPrompt, [], 6000
        );

        // Extract score
        $score = null;
        if (preg_match('/(\d{1,3})\s*%/', $this->result, $m)) {
            $score = (int) $m[1];
        }

        // Step 2: Complete the course with missing parts
        $this->loadingStep = 'Completion du cours avec les points manquants...';
        $completionPrompt = <<<PROMPT
Voici le support de cours actuel pour "{$title}" et son analyse de conformite avec le syllabus.

**SYLLABUS MINISTERIEL:**
{$this->syllabus}

**SUPPORT DE COURS ACTUEL:**
{$this->support}

**ANALYSE DE CONFORMITE:**
{$this->result}

Ta mission: Produire un support de cours COMPLET et AMELIORE qui:
1. Conserve tout le contenu existant du support actuel
2. Ajoute les chapitres/sections MANQUANTS identifies dans l'analyse (marques ❌ ou URGENT)
3. Developpe les sections PARTIELLES (marques ⚠️ ou IMPORTANT)
4. Respecte la structure et le style pedagogique du document original
5. Pour chaque ajout, inclus: definition, explication, exemples concrets, exercices

Format: Support de cours professionnel en Markdown. Commence directement par le contenu du cours, sans introduction.
PROMPT;

        $this->completedSupport = AiService::chat(
            "Tu es un professeur universitaire expert. Tu completes des supports de cours pour les rendre conformes aux syllabi ministeriels. Reponds en francais. Format Markdown structure.",
            $completionPrompt, [], 8000
        );

        // Step 3: Save to Base de Connaissances
        $this->loadingStep = 'Sauvegarde dans la Base de Connaissances...';
        $publishedDocId = null;
        $docTitle = $this->courseTitle ?: 'Cours - Sans titre';

        // Find or create the KnowledgeDocument
        $existingDoc = $this->selectedDocument ? KnowledgeDocument::find($this->selectedDocument) : null;
        if ($existingDoc) {
            // Update existing document with completed content
            $existingDoc->update(['content' => $this->completedSupport]);
            $publishedDocId = $existingDoc->id;
        } else {
            // Create new document
            $newDoc = KnowledgeDocument::create([
                'title'       => $docTitle,
                'filename'    => $docTitle . '.md',
                'content'     => $this->completedSupport,
                'type'        => 'text',
                'category_id' => $this->selectedCategory ?: null,
            ]);
            $publishedDocId = $newDoc->id;
        }

        // Save verification history
        SyllabusVerificationModel::create([
            'course_title'        => $docTitle,
            'category_id'         => $this->selectedCategory ?: null,
            'document_id'         => $this->selectedDocument ?: null,
            'syllabus'            => $this->syllabus,
            'support'             => $this->support,
            'completed_support'   => $this->completedSupport,
            'result'              => $this->result,
            'score'               => $score,
            'published_document_id' => $publishedDocId,
        ]);

        $this->loading = false;
        $this->loadingStep = '';

        Notification::make()
            ->title('Analyse complete ✅')
            ->body('Le cours a ete complete par l\'IA et sauvegarde dans la Base de Connaissances.')
            ->success()->persistent()->send();
    }
}
