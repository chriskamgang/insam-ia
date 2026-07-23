<?php

namespace App\Jobs;

use App\Models\Exam;
use App\Services\AiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateExamCorrection implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(public Exam $exam) {}

    public function handle(): void
    {
        if ($this->exam->is_corrected && $this->exam->correction_path) {
            return;
        }

        $categoryName = $this->exam->category?->name ?? 'General';

        $systemPrompt = "Tu es un professeur universitaire expert. Tu produis des corriges types detailles et pedagogiques pour les epreuves d'examen. Reponds en francais.";

        $userMessage = <<<PROMPT
Genere un corrige type detaille pour cette epreuve d'examen.

Titre: {$this->exam->title}
Matiere: {$this->exam->matiere}
Filiere: {$this->exam->filiere}
Niveau: {$this->exam->niveau}
Annee: {$this->exam->annee}
Categorie: {$categoryName}

Donne un corrige complet avec:
1. **Rappel du sujet** (resume les questions probables basees sur le titre et la matiere)
2. **Corrige detaille** pour chaque partie/question probable
3. **Methodologie** - comment aborder ce type d'examen
4. **Points cles** a retenir pour cette matiere
5. **Bareme indicatif** suggere

Si tu ne connais pas le contenu exact du sujet, genere un corrige type base sur le titre, la matiere et le niveau. Sois le plus precis et utile possible.

Format en Markdown bien structure.
PROMPT;

        $correction = AiService::chat($systemPrompt, $userMessage, [], 4000);

        if (str_starts_with($correction, 'Erreur')) {
            return;
        }

        $path = "exam-corrections/{$this->exam->id}.md";
        Storage::put($path, $correction);

        $this->exam->update([
            'correction_path' => $path,
            'is_corrected' => true,
        ]);
    }
}
