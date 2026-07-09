<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Debouche;
use App\Models\KnowledgeDocument;
use App\Models\RevisionCard;
use App\Models\RoadmapStep;
use App\Services\AiService;
use Illuminate\Http\Request;

class RevisionCardController extends Controller
{
    /**
     * List the authenticated user's revision cards, with optional category_id filter.
     */
    public function index(Request $request)
    {
        $query = RevisionCard::where('user_id', $request->user()->id)
            ->with('category')
            ->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Generate a new AI revision card for the given category.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
        ]);

        $category = Category::findOrFail($request->integer('category_id'));

        // Gather knowledge documents
        $documents = KnowledgeDocument::where('category_id', $category->id)->get();
        $documentsContent = $documents->map(function ($doc) {
            return "### {$doc->title}\n{$doc->content}";
        })->implode("\n\n");

        if (empty($documentsContent)) {
            $documentsContent = 'Aucun document disponible pour cette catégorie.';
        }

        // Gather roadmap steps
        $roadmapSteps = RoadmapStep::where('category_id', $category->id)
            ->orderBy('sort_order')
            ->orderBy('step_number')
            ->get();

        $roadmapContent = $roadmapSteps->map(function ($step) {
            $line = "- Étape {$step->step_number}: {$step->title}";
            if ($step->description) {
                $line .= " — {$step->description}";
            }
            if ($step->duration) {
                $line .= " ({$step->duration})";
            }
            return $line;
        })->implode("\n");

        if (empty($roadmapContent)) {
            $roadmapContent = 'Aucun parcours de formation disponible.';
        }

        // Gather debouches for additional context
        $debouches = Debouche::where('category_id', $category->id)
            ->orderBy('sort_order')
            ->get();

        $debouchesContent = $debouches->map(fn($d) => "- {$d->title}" . ($d->description ? ": {$d->description}" : ''))->implode("\n");

        $systemPrompt = 'Tu es un expert en pédagogie et en création de fiches de révision. Tu génères des fiches de révision complètes, claires et bien structurées en Markdown.';

        $userMessage = <<<PROMPT
Tu es un expert en pédagogie. Génère une fiche de révision complète et structurée pour la formation "{$category->name}".

Voici les documents et contenus disponibles:
{$documentsContent}

Parcours de formation:
{$roadmapContent}

Débouchés professionnels:
{$debouchesContent}

La fiche doit contenir:
1. **Résumé** - Un résumé concis du sujet
2. **Concepts clés** - Liste des concepts importants avec définitions
3. **Points essentiels à retenir** - Les informations cruciales
4. **Formules/Règles** - Si applicable
5. **Questions de révision** - 5-10 questions pour tester ses connaissances
6. **Conseils d'examen** - Astuces pour réussir

Format ta réponse en Markdown bien structuré.
PROMPT;

        try {
            $aiResponse = AiService::chat($systemPrompt, $userMessage, [], 4096);

            // Extract a short summary (first non-empty paragraph after the title)
            $summary = null;
            $lines = explode("\n", $aiResponse);
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed && !str_starts_with($trimmed, '#')) {
                    $summary = $trimmed;
                    break;
                }
            }

            // Extract key points from the AI response (lines starting with - or *)
            $keyPoints = [];
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (preg_match('/^[-*]\s+(.+)$/', $trimmed, $matches)) {
                    $keyPoints[] = $matches[1];
                    if (count($keyPoints) >= 10) {
                        break;
                    }
                }
            }

            $card = RevisionCard::create([
                'user_id'     => $request->user()->id,
                'category_id' => $category->id,
                'title'       => "Fiche de révision — {$category->name}",
                'content'     => $aiResponse,
                'summary'     => $summary,
                'key_points'  => $keyPoints ?: null,
                'status'      => 'completed',
                'source'      => $category->name,
            ]);

            return response()->json($card->load('category'), 201);
        } catch (\Throwable $e) {
            // Save a failed card so the user knows something went wrong
            $card = RevisionCard::create([
                'user_id'     => $request->user()->id,
                'category_id' => $category->id,
                'title'       => "Fiche de révision — {$category->name}",
                'content'     => '',
                'status'      => 'failed',
                'source'      => $category->name,
            ]);

            return response()->json([
                'message' => 'La génération de la fiche a échoué.',
                'error'   => $e->getMessage(),
                'card'    => $card,
            ], 500);
        }
    }

    /**
     * Show a single revision card belonging to the authenticated user.
     */
    public function show(Request $request, int $id)
    {
        $card = RevisionCard::where('user_id', $request->user()->id)
            ->with('category')
            ->findOrFail($id);

        return response()->json($card);
    }

    /**
     * Delete a revision card belonging to the authenticated user.
     */
    public function destroy(Request $request, int $id)
    {
        $card = RevisionCard::where('user_id', $request->user()->id)->findOrFail($id);
        $card->delete();

        return response()->json(['message' => 'Fiche supprimée avec succès.']);
    }
}
