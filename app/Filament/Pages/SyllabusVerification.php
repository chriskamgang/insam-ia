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
use Illuminate\Support\Facades\Storage;
use Livewire\WithFileUploads;

class SyllabusVerification extends Page implements HasForms
{
    use InteractsWithForms, WithFileUploads;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentCheck;
    protected static ?string $navigationLabel = 'Verification Syllabus';
    protected static ?string $title = 'Verification de conformite';
    protected static ?int $navigationSort = 90;
    protected static \UnitEnum|string|null $navigationGroup = 'Outils IA';

    protected string $view = 'filament.pages.syllabus-verification';

    public ?string $selectedCategory = null;
    public ?string $selectedDocument = null;
    public string $syllabus = '';
    public string $support = '';
    public string $courseTitle = '';
    public string $result = '';
    public bool $loading = false;
    public ?int $viewingHistoryId = null;
    public $supportFile = null;

    protected $queryString = ['doc'];
    public ?string $doc = null;

    public function mount(): void
    {
        // Pre-load document if ?doc=ID is in URL
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
            ->pluck('title', 'id')
            ->toArray();
    }

    public function getHistoryProperty()
    {
        return SyllabusVerificationModel::with('category:id,name')
            ->latest()
            ->limit(20)
            ->get();
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
        $this->result = $record->result;
        $this->selectedCategory = $record->category_id ? (string) $record->category_id : null;
        $this->selectedDocument = $record->document_id ? (string) $record->document_id : null;
        $this->viewingHistoryId = $id;
    }

    public function deleteHistory(int $id): void
    {
        SyllabusVerificationModel::where('id', $id)->delete();
        if ($this->viewingHistoryId === $id) {
            $this->reset(['result', 'viewingHistoryId']);
        }
        Notification::make()->title('Verification supprimee')->success()->send();
    }

    public function updatedSupportFile(): void
    {
        if (!$this->supportFile) return;

        $file = $this->supportFile;
        $ext = strtolower($file->getClientOriginalExtension());
        $tmpPath = $file->getRealPath();
        $text = '';

        try {
            if ($ext === 'txt') {
                $text = file_get_contents($tmpPath);
            } elseif ($ext === 'docx') {
                $text = $this->extractDocxText($tmpPath);
            } elseif ($ext === 'doc') {
                $text = $this->extractDocText($tmpPath);
            } elseif ($ext === 'pdf') {
                $text = $this->extractPdfText($tmpPath);
            }
        } catch (\Throwable $e) {
            $text = '';
        }

        if (trim($text)) {
            $this->support = trim($text);
            $chars = number_format(strlen($text));
            Notification::make()->title('Fichier importe')->body("Contenu extrait ({$chars} caracteres).")->success()->send();
        } else {
            Notification::make()->title('Extraction echouee')->body('Impossible d\'extraire le texte. Collez le contenu manuellement.')->warning()->send();
        }

        $this->supportFile = null;
    }

    private function extractDocxText(string $path): string
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) return '';

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if (!$xml) return '';

        // Strip XML tags but keep paragraph breaks
        $xml = str_replace('</w:p>', "\n", $xml);
        $xml = str_replace('</w:tr>', "\n", $xml);
        $text = strip_tags($xml);
        // Clean up whitespace
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }

    private function extractDocText(string $path): string
    {
        // Try antiword first
        exec("antiword " . escapeshellarg($path) . " 2>/dev/null", $output, $code);
        if ($code === 0 && !empty($output)) {
            return implode("\n", $output);
        }
        // Try LibreOffice
        $tmpDir = sys_get_temp_dir() . '/lo_' . uniqid();
        @mkdir($tmpDir, 0755, true);
        exec("HOME=/tmp libreoffice --headless --convert-to txt --outdir " . escapeshellarg($tmpDir) . " " . escapeshellarg($path) . " 2>&1", $out2, $code2);
        $files = glob("$tmpDir/*.txt");
        $text = '';
        if (!empty($files)) {
            $text = file_get_contents($files[0]);
        }
        @array_map('unlink', glob("$tmpDir/*"));
        @rmdir($tmpDir);
        return $text;
    }

    private function extractPdfText(string $path): string
    {
        $outputFile = tempnam(sys_get_temp_dir(), 'pdf_') . '.txt';
        exec("pdftotext " . escapeshellarg($path) . " " . escapeshellarg($outputFile) . " 2>/dev/null", $output, $code);
        if ($code === 0 && file_exists($outputFile)) {
            $text = file_get_contents($outputFile);
            @unlink($outputFile);
            return $text;
        }
        @unlink($outputFile);
        return '';
    }

    public function verify(): void
    {
        if (strlen(trim($this->syllabus)) < 10) {
            Notification::make()->title('Syllabus trop court')->body('Veuillez saisir ou charger le syllabus ministeriel.')->danger()->send();
            return;
        }
        if (strlen(trim($this->support)) < 10) {
            Notification::make()->title('Support trop court')->body('Veuillez coller le contenu du support de cours.')->danger()->send();
            return;
        }

        $this->loading = true;
        $this->viewingHistoryId = null;

        $title = $this->courseTitle ?: 'ce cours';

        $systemPrompt = "Tu es un expert en pedagogie universitaire et en conformite des programmes d'enseignement au Cameroun. Tu compares les syllabi ministeriels avec les supports de cours pour identifier les ecarts. Reponds en francais. Utilise le format Markdown avec des tableaux. IMPORTANT: Commence TOUJOURS ta reponse par le verdict et le score.";

        $userMessage = <<<PROMPT
Compare le syllabus ministeriel avec le support de cours pour "{$title}" et identifie les ecarts.

**SYLLABUS MINISTERIEL:**
{$this->syllabus}

**SUPPORT DE COURS:**
{$this->support}

IMPORTANT: Commence ta reponse EXACTEMENT par ce format:

## VERDICT: [CONFORME / PARTIELLEMENT CONFORME / NON CONFORME]
## Score de conformite: XX%

Puis fais une analyse detaillee avec:

1. **Resume executif** - En 2-3 phrases, dis clairement si le support de cours couvre ou non le syllabus ministeriel. Sois direct: "Le support est conforme/non conforme car..."

2. **Tableau de conformite** - Pour chaque point/chapitre du syllabus:
   | Point du syllabus | Statut | Couverture | Remarque |
   Statut: ✅ Complet, ⚠️ Partiel, ❌ Absent

3. **Points manquants (❌)** - Points du syllabus NON couverts dans le support. Pour chaque point manquant, explique son importance.

4. **Points partiellement couverts (⚠️)** - Points presents mais insuffisamment developpes, avec ce qui manque.

5. **Points supplementaires** - Elements dans le support qui ne sont pas dans le syllabus (bonus ou hors programme)

6. **Recommandations d'amelioration** - Actions concretes classees par priorite (URGENT / IMPORTANT / SOUHAITABLE) pour mettre le support en conformite.

Criteres de verdict:
- CONFORME: Score >= 80%, aucun point majeur manquant
- PARTIELLEMENT CONFORME: Score entre 50% et 79%, quelques lacunes
- NON CONFORME: Score < 50%, lacunes importantes

Sois precis, objectif et direct dans ton analyse.
PROMPT;

        $this->result = AiService::chat($systemPrompt, $userMessage, [], 8000);
        $this->loading = false;

        // Extract score
        $score = null;
        if (preg_match('/(\d{1,3})\s*%/', $this->result, $m)) {
            $score = (int) $m[1];
        }

        // Save to history
        SyllabusVerificationModel::create([
            'course_title' => $this->courseTitle ?: 'Sans titre',
            'category_id' => $this->selectedCategory ?: null,
            'document_id' => $this->selectedDocument ?: null,
            'syllabus' => $this->syllabus,
            'support' => $this->support,
            'result' => $this->result,
            'score' => $score,
        ]);

        Notification::make()->title('Analyse terminee et sauvegardee')->success()->send();
    }
}
