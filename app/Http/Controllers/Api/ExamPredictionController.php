<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Exam;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use Illuminate\Http\Request;

class ExamPredictionController extends Controller
{
    /**
     * Analyze all exams for a category, grouped by matière.
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
        ]);

        $category = Category::findOrFail($request->integer('category_id'));

        $exams = Exam::where('category_id', $category->id)
            ->orderBy('annee', 'desc')
            ->get();

        $grouped = $exams->groupBy('matiere');

        $matieres = $grouped->map(function ($examGroup, $matiere) {
            $years = $examGroup->pluck('annee')->filter()->unique()->sort()->values()->toArray();

            return [
                'matiere'    => $matiere,
                'exam_count' => $examGroup->count(),
                'years'      => $years,
                'exams'      => $examGroup->map(fn($e) => [
                    'id'     => $e->id,
                    'title'  => $e->title,
                    'annee'  => $e->annee,
                    'niveau' => $e->niveau,
                ])->values()->toArray(),
            ];
        })->values()->toArray();

        return response()->json([
            'category'    => ['id' => $category->id, 'name' => $category->name],
            'matieres'    => $matieres,
            'total_exams' => $exams->count(),
        ]);
    }

    /**
     * Generate a full AI exam prediction for a given category + matière.
     */
    public function predict(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
            'matiere'     => 'required|string|max:255',
        ]);

        $category = Category::findOrFail($request->integer('category_id'));
        $matiere  = $request->string('matiere')->toString();

        $exams = Exam::where('category_id', $category->id)
            ->where('matiere', $matiere)
            ->orderBy('annee', 'desc')
            ->get();

        $documents = KnowledgeDocument::where('category_id', $category->id)
            ->whereIn('type', ['exam', 'course'])
            ->get();

        // Build a map of document content keyed by title for quick lookup
        $docMap = $documents->mapWithKeys(fn($d) => [$d->title => $d->content]);

        // Build the exam listing section of the prompt
        $examsText = '';
        foreach ($exams as $exam) {
            $examsText .= "---\n";
            $examsText .= "Titre: {$exam->title}\n";
            $examsText .= "Année: {$exam->annee}\n";
            $examsText .= "Niveau: {$exam->niveau}\n";

            // Attach related document content if a matching doc exists
            $relatedContent = $docMap->first(fn($content, $title) =>
                str_contains(strtolower($title), strtolower($exam->title)) ||
                str_contains(strtolower($exam->title), strtolower($title))
            );

            if ($relatedContent) {
                $excerpt = mb_substr($relatedContent, 0, 500);
                $examsText .= "Contenu (extrait): {$excerpt}\n";
            }

            $examsText .= "\n";
        }

        if (empty(trim($examsText))) {
            $examsText = "Aucun sujet d'examen disponible pour cette matière.\n";
        }

        // Append general knowledge documents for extra context
        $docsContext = '';
        if ($documents->isNotEmpty()) {
            $docsContext = "\nDocuments de cours et d'examens disponibles pour la filière:\n";
            foreach ($documents as $doc) {
                $excerpt = mb_substr($doc->content ?? '', 0, 300);
                $docsContext .= "- [{$doc->type}] {$doc->title}: {$excerpt}\n";
            }
        }

        $systemPrompt = 'Tu es un expert en analyse de tendances académiques. Tu analyses les sujets d\'examens passés pour identifier les thèmes récurrents et prédire les sujets probables pour le prochain examen.';

        $userMessage = <<<PROMPT
Filière: {$category->name}
Matière: {$matiere}

Voici les sujets d'examens disponibles:
{$examsText}{$docsContext}

Analyse ces sujets et fournis:

1. **Thèmes récurrents**: Liste les thèmes/chapitres qui reviennent le plus souvent avec leur fréquence (en pourcentage)
2. **Tendances observées**: Quelles évolutions dans les types de questions posées au fil des années
3. **Sujet prédit**: Génère un sujet d'examen complet et réaliste qui pourrait tomber au prochain examen, basé sur l'analyse des tendances. Le sujet doit avoir:
   - Un en-tête officiel (université, filière, matière, durée)
   - Partie A: Questions de cours (4-5 questions)
   - Partie B: Exercices pratiques (2-3 exercices)
   - Partie C: Problème/Étude de cas (1 problème complet)
4. **Conseils de préparation**: 5 conseils spécifiques basés sur les tendances identifiées

Format en Markdown bien structuré.
PROMPT;

        try {
            $prediction = AiService::chat($systemPrompt, $userMessage, [], 4096);

            return response()->json([
                'category'   => ['id' => $category->id, 'name' => $category->name],
                'matiere'    => $matiere,
                'exam_count' => $exams->count(),
                'years'      => $exams->pluck('annee')->filter()->unique()->sort()->values(),
                'prediction' => $prediction,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'La génération de la prédiction a échoué.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a brief AI overview (top 3 recurring themes) for every matière in a category.
     */
    public function predictAll(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
        ]);

        $category = Category::findOrFail($request->integer('category_id'));

        $matieres = Exam::where('category_id', $category->id)
            ->whereNotNull('matiere')
            ->where('matiere', '!=', '')
            ->distinct()
            ->pluck('matiere');

        if ($matieres->isEmpty()) {
            return response()->json([
                'category' => ['id' => $category->id, 'name' => $category->name],
                'overview' => [],
                'message'  => 'Aucune matière trouvée pour cette filière.',
            ]);
        }

        $overviews = [];

        foreach ($matieres as $matiere) {
            $exams = Exam::where('category_id', $category->id)
                ->where('matiere', $matiere)
                ->orderBy('annee', 'desc')
                ->get();

            $examList = $exams->map(fn($e) => "- {$e->title} ({$e->annee}, {$e->niveau})")->implode("\n");

            $systemPrompt = 'Tu es un expert en analyse de tendances académiques. Fournis une analyse concise et structurée.';

            $userMessage = <<<PROMPT
Filière: {$category->name}
Matière: {$matiere}

Sujets d'examens passés:
{$examList}

Identifie uniquement les 3 thèmes les plus récurrents dans ces examens. Pour chaque thème, donne:
- Le nom du thème
- Sa fréquence approximative (en pourcentage)
- Une phrase de description

Réponds en JSON avec ce format exact:
{
  "themes": [
    {"theme": "...", "frequency": "...", "description": "..."},
    {"theme": "...", "frequency": "...", "description": "..."},
    {"theme": "...", "frequency": "...", "description": "..."}
  ]
}
PROMPT;

            try {
                $aiResponse = AiService::chat($systemPrompt, $userMessage, [], 1024);

                // Extract JSON from the AI response
                $themes = null;
                if (preg_match('/\{[\s\S]*\}/u', $aiResponse, $matches)) {
                    $decoded = json_decode($matches[0], true);
                    if (isset($decoded['themes'])) {
                        $themes = $decoded['themes'];
                    }
                }

                $overviews[] = [
                    'matiere'    => $matiere,
                    'exam_count' => $exams->count(),
                    'years'      => $exams->pluck('annee')->filter()->unique()->sort()->values(),
                    'top_themes' => $themes ?? [],
                    'raw'        => $themes ? null : $aiResponse,
                ];
            } catch (\Throwable $e) {
                $overviews[] = [
                    'matiere'    => $matiere,
                    'exam_count' => $exams->count(),
                    'years'      => $exams->pluck('annee')->filter()->unique()->sort()->values(),
                    'top_themes' => [],
                    'error'      => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'category' => ['id' => $category->id, 'name' => $category->name],
            'overview' => $overviews,
        ]);
    }
}
