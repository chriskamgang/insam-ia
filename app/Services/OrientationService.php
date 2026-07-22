<?php

namespace App\Services;

use App\Models\Ecole;
use App\Models\Filiere;
use App\Models\OrientationQuestion;

class OrientationService
{
    /**
     * Generate filiere-level questions for an ecole using AI.
     */
    public static function generateFiliereQuestions(Ecole $ecole): int
    {
        $filieres = $ecole->filieres()->with('specialites')->get();

        if ($filieres->isEmpty()) {
            return 0;
        }

        $filiereList = $filieres->map(fn ($f) => "- {$f->name}" . ($f->description ? " ({$f->description})" : ''))->implode("\n");

        $systemPrompt = "Tu es un conseiller d'orientation scolaire expert au Cameroun. Tu generes des questions pertinentes pour orienter les etudiants vers la bonne filiere. Reponds UNIQUEMENT en JSON strict.";

        $filiereNames = $filieres->pluck('name')->implode('", "');

        $userMessage = <<<PROMPT
Genere 6 questions d'orientation pour aider un etudiant a choisir sa filiere a l'ecole "{$ecole->name}".

Voici les NOMS EXACTS des filieres (a copier-coller tels quels dans les scores):
["{$filiereNames}"]

Liste detaillee:
{$filiereList}

Chaque question doit avoir 4 options de reponse. Chaque option doit favoriser certaines filieres.

Reponds en JSON strict avec ce format:
[
  {
    "question": "Quelle activite vous interesse le plus ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "scores": {
      "option_0": {"{$filieres->first()->name}": 3},
      "option_1": {"{$filieres->skip(1)->first()?->name}": 3},
      "option_2": {"{$filieres->skip(2)->first()?->name}": 3},
      "option_3": {"{$filieres->skip(3)->first()?->name}": 3}
    }
  }
]

REGLE ABSOLUE: Dans les "scores", les noms des filieres doivent etre COPIES EXACTEMENT depuis la liste ci-dessus. Ne modifie PAS les noms, ne les abrege pas, ne les traduis pas.
Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

        $response = AiService::chat($systemPrompt, $userMessage, [], 4000);

        return self::parseAndSaveQuestions($response, 'filiere', $ecole->id, null);
    }

    /**
     * Generate specialite-level questions for a filiere using AI.
     */
    public static function generateSpecialiteQuestions(Filiere $filiere): int
    {
        $specialites = $filiere->specialites;

        if ($specialites->isEmpty()) {
            return 0;
        }

        $specList = $specialites->map(fn ($s) => "- {$s->name}" . ($s->description ? " ({$s->description})" : ''))->implode("\n");
        $ecoleName = $filiere->ecole?->name ?? '';

        $systemPrompt = "Tu es un conseiller d'orientation scolaire expert au Cameroun. Tu generes des questions pertinentes pour orienter les etudiants vers la bonne specialite. Reponds UNIQUEMENT en JSON strict.";

        $specNames = $specialites->pluck('name')->implode('", "');

        $userMessage = <<<PROMPT
Genere 5 questions d'orientation pour aider un etudiant de la filiere "{$filiere->name}" ({$ecoleName}) a choisir sa specialite.

Voici les NOMS EXACTS des specialites (a copier-coller tels quels dans les scores):
["{$specNames}"]

Liste detaillee:
{$specList}

Chaque question doit avoir 3-4 options de reponse. Chaque option doit favoriser certaines specialites.

Reponds en JSON strict avec ce format:
[
  {
    "question": "Quel aspect vous attire le plus ?",
    "options": ["Option A", "Option B", "Option C"],
    "scores": {
      "option_0": {"{$specialites->first()->name}": 3},
      "option_1": {"{$specialites->skip(1)->first()?->name}": 3},
      "option_2": {"{$specialites->skip(2)->first()?->name}": 3}
    }
  }
]

REGLE ABSOLUE: Dans les "scores", les noms des specialites doivent etre COPIES EXACTEMENT depuis la liste ci-dessus. Ne modifie PAS les noms, ne les abrege pas, ne les traduis pas.
Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

        $response = AiService::chat($systemPrompt, $userMessage, [], 4000);

        return self::parseAndSaveQuestions($response, 'specialite', $filiere->ecole_id, $filiere->id);
    }

    private static function parseAndSaveQuestions(string $response, string $level, ?int $ecoleId, ?int $filiereId): int
    {
        if (str_starts_with($response, 'Erreur')) {
            return 0;
        }

        $json = $response;
        if (preg_match('/\[[\s\S]*\]/u', $response, $matches)) {
            $json = $matches[0];
        }

        $questions = json_decode($json, true);

        if (!is_array($questions) || empty($questions)) {
            return 0;
        }

        $count = 0;
        foreach ($questions as $i => $q) {
            if (empty($q['question']) || empty($q['options'])) {
                continue;
            }

            $options = is_array($q['options']) ? $q['options'] : [];
            $scores = is_array($q['scores'] ?? null) ? $q['scores'] : [];

            OrientationQuestion::create([
                'level' => $level,
                'ecole_id' => $ecoleId,
                'filiere_id' => $filiereId,
                'question' => $q['question'],
                'options' => $options,
                'scores' => $scores,
                'sort_order' => $i + 1,
            ]);

            $count++;
        }

        return $count;
    }
}
