<?php

namespace App\Filament\Pages;

use App\Models\Category;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class SyllabusVerification extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentCheck;
    protected static ?string $navigationLabel = 'Verification Syllabus';
    protected static ?string $title = 'Verification de conformite';
    protected static ?int $navigationSort = 90;
    protected static ?string $navigationGroup = 'Outils IA';

    protected string $view = 'filament.pages.syllabus-verification';

    public ?string $selectedCategory = null;
    public ?string $selectedDocument = null;
    public string $syllabus = '';
    public string $support = '';
    public string $courseTitle = '';
    public string $result = '';
    public bool $loading = false;

    public function getDocumentsProperty(): array
    {
        if (!$this->selectedCategory) return [];

        return KnowledgeDocument::where('category_id', $this->selectedCategory)
            ->pluck('title', 'id')
            ->toArray();
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

        $title = $this->courseTitle ?: 'ce cours';

        $systemPrompt = "Tu es un expert en pedagogie universitaire et en conformite des programmes d'enseignement au Cameroun. Tu compares les syllabi ministeriels avec les supports de cours pour identifier les ecarts. Reponds en francais. Utilise le format Markdown avec des tableaux.";

        $userMessage = <<<PROMPT
Compare le syllabus ministeriel avec le support de cours pour "{$title}" et identifie les ecarts.

**SYLLABUS MINISTERIEL:**
{$this->syllabus}

**SUPPORT DE COURS:**
{$this->support}

Fais une analyse detaillee avec:

1. **Tableau de conformite** - Pour chaque point/chapitre du syllabus, indique:
   | Point du syllabus | Present dans le support | Niveau de couverture | Remarque |
   Utilise des indicateurs: Complet, Partiel, Absent

2. **Points manquants** - Liste detaillee des points du syllabus qui ne sont PAS couverts dans le support de cours, avec leur importance

3. **Points partiellement couverts** - Points presents mais insuffisamment developpes, avec ce qui manque specifiquement

4. **Points supplementaires** - Elements dans le support qui ne sont pas dans le syllabus (bonus ou hors programme)

5. **Score de conformite** - Pourcentage global de couverture du syllabus

6. **Recommandations d'amelioration** - Actions concretes pour mettre le support en conformite avec le syllabus, classees par priorite

Sois precis et objectif dans ton analyse.
PROMPT;

        $this->result = AiService::chat($systemPrompt, $userMessage, [], 8000);
        $this->loading = false;

        Notification::make()->title('Analyse terminee')->success()->send();
    }
}
