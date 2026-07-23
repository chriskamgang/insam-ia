<?php

namespace App\Filament\Resources\RoadmapSteps\Pages;

use App\Filament\Resources\RoadmapSteps\RoadmapStepResource;
use App\Models\Category;
use App\Models\RoadmapStep;
use App\Services\AiService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListRoadmapSteps extends ListRecords
{
    protected static string $resource = RoadmapStepResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('generate_ai')
                ->label('Generer avec IA')
                ->icon('heroicon-o-sparkles')
                ->color('success')
                ->form([
                    Select::make('category_id')
                        ->label('Formation / Categorie')
                        ->options(Category::pluck('name', 'id'))
                        ->required()
                        ->native(false)
                        ->searchable(),
                ])
                ->action(function (array $data) {
                    $category = Category::findOrFail($data['category_id']);

                    $existing = RoadmapStep::where('category_id', $category->id)->count();
                    if ($existing > 0) {
                        Notification::make()
                            ->title('Roadmap existant')
                            ->body("Cette categorie a deja {$existing} etape(s). Supprimez-les d'abord ou choisissez une autre categorie.")
                            ->warning()
                            ->send();
                        return;
                    }

                    $systemPrompt = "Tu es un expert en education et en conception de parcours de formation. Tu generes des roadmaps d'apprentissage structurees.";

                    $userMessage = <<<PROMPT
Genere un parcours d'apprentissage (roadmap) complet pour la formation "{$category->name}".

Donne exactement 6 a 8 etapes progressives du debutant au niveau avance.

Pour chaque etape, reponds en JSON strict (un tableau JSON), chaque element ayant:
- "step_number": numero de l'etape (1, 2, 3...)
- "title": titre court de l'etape
- "description": description detaillee (2-3 phrases)
- "level": un parmi "debutant", "intermediaire", "avance"
- "duration": duree estimee (ex: "2 semaines", "1 mois")
- "skills": tableau de 3-5 competences cles acquises
- "icon": une icone Font Awesome (ex: "fas fa-code", "fas fa-database")
- "color": une couleur hex (varie les couleurs: #3B82F6, #10B981, #F59E0B, #EF4444, #8B5CF6, #EC4899, #06B6D4, #F97316)

Reponds UNIQUEMENT avec le tableau JSON, sans texte avant ou apres.
PROMPT;

                    try {
                        $response = AiService::chat($systemPrompt, $userMessage, [], 3000);

                        // Extract JSON from response
                        $json = $response;
                        if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
                            $json = $matches[0];
                        }

                        $steps = json_decode($json, true);

                        if (!is_array($steps) || empty($steps)) {
                            Notification::make()
                                ->title('Erreur IA')
                                ->body('L\'IA n\'a pas retourne un format valide. Reessayez.')
                                ->danger()
                                ->send();
                            return;
                        }

                        foreach ($steps as $step) {
                            RoadmapStep::create([
                                'category_id' => $category->id,
                                'step_number' => $step['step_number'] ?? 0,
                                'title' => $step['title'] ?? 'Sans titre',
                                'description' => $step['description'] ?? '',
                                'level' => $step['level'] ?? 'debutant',
                                'duration' => $step['duration'] ?? '',
                                'skills' => is_array($step['skills'] ?? null) ? implode(', ', $step['skills']) : ($step['skills'] ?? ''),
                                'icon' => $step['icon'] ?? 'fas fa-book',
                                'color' => $step['color'] ?? '#3B82F6',
                                'sort_order' => $step['step_number'] ?? 0,
                            ]);
                        }

                        Notification::make()
                            ->title('Roadmap genere !')
                            ->body(count($steps) . " etapes creees pour \"{$category->name}\".")
                            ->success()
                            ->send();

                    } catch (\Throwable $e) {
                        Notification::make()
                            ->title('Erreur')
                            ->body('Erreur lors de la generation: ' . $e->getMessage())
                            ->danger()
                            ->send();
                    }
                })
                ->requiresConfirmation()
                ->modalHeading('Generer un roadmap avec l\'IA')
                ->modalDescription('L\'IA va creer automatiquement les etapes du parcours pour la formation choisie.')
                ->modalSubmitActionLabel('Generer'),

            CreateAction::make(),
        ];
    }
}
