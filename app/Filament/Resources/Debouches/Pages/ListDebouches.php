<?php

namespace App\Filament\Resources\Debouches\Pages;

use App\Filament\Resources\Debouches\DeboucheResource;
use App\Models\Category;
use App\Models\Debouche;
use App\Services\AiService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListDebouches extends ListRecords
{
    protected static string $resource = DeboucheResource::class;

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

                    $existing = Debouche::where('category_id', $category->id)->count();
                    if ($existing > 0) {
                        Notification::make()
                            ->title('Debouches existants')
                            ->body("Cette categorie a deja {$existing} debouche(s). Supprimez-les d'abord ou choisissez une autre categorie.")
                            ->warning()
                            ->send();
                        return;
                    }

                    $systemPrompt = "Tu es un expert en orientation professionnelle et en marche de l'emploi en Afrique. Tu connais les debouches pour chaque filiere de formation.";

                    $userMessage = <<<PROMPT
Genere une liste de debouches professionnels pour la formation "{$category->name}".

Donne exactement 6 a 10 debouches realistes et pertinents pour le marche africain.

Pour chaque debouche, reponds en JSON strict (un tableau JSON), chaque element ayant:
- "title": titre du poste/metier
- "description": description du metier et ses responsabilites (2-3 phrases)
- "icon": une icone Font Awesome pertinente (ex: "fas fa-briefcase", "fas fa-chart-line", "fas fa-building")

Reponds UNIQUEMENT avec le tableau JSON, sans texte avant ou apres.
PROMPT;

                    try {
                        $response = AiService::chat($systemPrompt, $userMessage, [], 3000);

                        $json = $response;
                        if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
                            $json = $matches[0];
                        }

                        $debouches = json_decode($json, true);

                        if (!is_array($debouches) || empty($debouches)) {
                            Notification::make()
                                ->title('Erreur IA')
                                ->body('L\'IA n\'a pas retourne un format valide. Reessayez.')
                                ->danger()
                                ->send();
                            return;
                        }

                        foreach ($debouches as $i => $d) {
                            Debouche::create([
                                'category_id' => $category->id,
                                'title' => $d['title'] ?? 'Sans titre',
                                'description' => $d['description'] ?? '',
                                'icon' => $d['icon'] ?? 'fas fa-briefcase',
                                'sort_order' => $i + 1,
                            ]);
                        }

                        Notification::make()
                            ->title('Debouches generes !')
                            ->body(count($debouches) . " debouches crees pour \"{$category->name}\".")
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
                ->modalHeading('Generer les debouches avec l\'IA')
                ->modalDescription('L\'IA va creer automatiquement les debouches professionnels pour la formation choisie.')
                ->modalSubmitActionLabel('Generer'),

            CreateAction::make(),
        ];
    }
}
