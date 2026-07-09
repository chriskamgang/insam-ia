<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with('category:id,name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('filiere')) {
            $query->where('filiere', $request->filiere);
        }

        if ($request->filled('matiere')) {
            $query->where('matiere', $request->matiere);
        }

        if ($request->filled('niveau')) {
            $query->where('niveau', $request->niveau);
        }

        if ($request->filled('annee')) {
            $query->where('annee', $request->annee);
        }

        $exams = $query->latest()->get();

        return response()->json(['exams' => $exams]);
    }

    public function show($id)
    {
        $exam = Exam::with('category:id,name')->findOrFail($id);

        return response()->json(['exam' => $exam]);
    }

    public function download($id)
    {
        $exam = Exam::findOrFail($id);

        if (!$exam->file_path || !Storage::exists($exam->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $exam->increment('downloads_count');

        return Storage::download($exam->file_path, $exam->title . '.pdf');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'matiere'     => 'required|string|max:255',
            'filiere'     => 'required|string|max:255',
            'niveau'      => 'required|string|max:255',
            'annee'       => 'required|string|max:10',
            'category_id' => 'nullable|exists:categories,id',
            'file'        => 'required|file|mimes:pdf,doc,docx|max:20480',
        ]);

        $file = $request->file('file');
        $path = $file->store('exams', 'public');

        // Extract text content for knowledge base
        $content = null;
        if ($file->getClientOriginalExtension() === 'pdf') {
            // Basic text extraction attempt; parsers may not be installed
            try {
                $content = file_get_contents($file->getRealPath());
            } catch (\Throwable $e) {
                $content = null;
            }
        }

        $exam = Exam::create([
            'title'       => $request->title,
            'category_id' => $request->category_id,
            'filiere'     => $request->filiere,
            'matiere'     => $request->matiere,
            'niveau'      => $request->niveau,
            'annee'       => $request->annee,
            'file_path'   => $path,
            'uploaded_by' => $request->user()->id,
            'source'      => 'student',
        ]);

        // Store in knowledge documents so the AI can reference this exam
        KnowledgeDocument::create([
            'title'       => "Examen : {$request->title} ({$request->matiere} - {$request->annee})",
            'filename'    => $file->getClientOriginalName(),
            'content'     => $content ?? "Examen de {$request->matiere} pour la filiere {$request->filiere}, niveau {$request->niveau}, annee {$request->annee}.",
            'type'        => 'exam',
            'category_id' => $request->category_id,
        ]);

        return response()->json(['exam' => $exam], 201);
    }

    /**
     * Generate AI correction/solution for an exam.
     */
    public function aiCorrection($id)
    {
        $exam = Exam::with('category:id,name')->findOrFail($id);

        // Check if we already have a cached correction
        if ($exam->correction_path && Storage::exists($exam->correction_path)) {
            return response()->json([
                'correction' => Storage::get($exam->correction_path),
                'cached' => true,
            ]);
        }

        $categoryName = $exam->category?->name ?? 'General';

        $systemPrompt = "Tu es un professeur universitaire expert. Tu produis des corriges types detailles et pedagogiques pour les epreuves d'examen. Reponds en francais.";

        $userMessage = <<<PROMPT
Genere un corrige type detaille pour cette epreuve d'examen.

Titre: {$exam->title}
Matiere: {$exam->matiere}
Filiere: {$exam->filiere}
Niveau: {$exam->niveau}
Annee: {$exam->annee}
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

        // Cache the correction
        $path = "exam-corrections/{$exam->id}.md";
        Storage::put($path, $correction);
        $exam->update(['correction_path' => $path, 'is_corrected' => true]);

        return response()->json([
            'correction' => $correction,
            'cached' => false,
        ]);
    }
}
