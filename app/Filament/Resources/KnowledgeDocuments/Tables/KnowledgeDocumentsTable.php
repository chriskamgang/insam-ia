<?php

namespace App\Filament\Resources\KnowledgeDocuments\Tables;

use App\Models\SyllabusVerification;
use App\Services\AiService;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class KnowledgeDocumentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Titre')
                    ->searchable()
                    ->limit(40),
                TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pdf' => 'danger',
                        'doc', 'docx' => 'info',
                        'course' => 'success',
                        'image' => 'warning',
                        default => 'gray',
                    }),
                IconColumn::make('file_path')
                    ->label('Fichier')
                    ->boolean()
                    ->trueIcon('heroicon-o-document')
                    ->falseIcon('heroicon-o-x-mark'),
                IconColumn::make('content')
                    ->label('Contenu')
                    ->boolean()
                    ->getStateUsing(fn ($record) => !empty($record->content))
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-clock'),
                TextColumn::make('category.name')
                    ->label('Specialite')
                    ->searchable()
                    ->placeholder('—'),
                TextColumn::make('uniteEnseignement.nom')
                    ->label('UE')
                    ->searchable()
                    ->sortable()
                    ->placeholder('—'),
                TextColumn::make('created_at')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                Action::make('verify')
                    ->label('Verifier')
                    ->icon('heroicon-o-clipboard-document-check')
                    ->color('warning')
                    ->modalHeading(fn ($record) => "Verification: {$record->title}")
                    ->modalDescription('Collez le support de cours pour comparer avec le syllabus.')
                    ->modalWidth('3xl')
                    ->form([
                        Textarea::make('support')
                            ->label('Support de cours')
                            ->placeholder('Collez le contenu du support de cours ici...')
                            ->rows(15)
                            ->required(),
                    ])
                    ->action(function ($record, array $data) {
                        $syllabus = $record->content;
                        $support = $data['support'];
                        $title = $record->title;

                        if (strlen(trim($syllabus)) < 10) {
                            Notification::make()->title('Syllabus vide')->body('Ce document n\'a pas de contenu syllabus.')->danger()->send();
                            return;
                        }

                        $systemPrompt = "Tu es un expert en pedagogie universitaire et en conformite des programmes d'enseignement au Cameroun. Tu compares les syllabi ministeriels avec les supports de cours pour identifier les ecarts. Reponds en francais. Utilise le format Markdown avec des tableaux.";

                        $userMessage = <<<PROMPT
Compare le syllabus ministeriel avec le support de cours pour "{$title}" et identifie les ecarts.

**SYLLABUS MINISTERIEL:**
{$syllabus}

**SUPPORT DE COURS:**
{$support}

Fais une analyse detaillee avec:

1. **Tableau de conformite** - Pour chaque point/chapitre du syllabus, indique:
   | Point du syllabus | Present dans le support | Niveau de couverture | Remarque |
   Utilise des indicateurs: Complet, Partiel, Absent

2. **Points manquants** - Liste detaillee des points du syllabus qui ne sont PAS couverts dans le support de cours

3. **Points partiellement couverts** - Points presents mais insuffisamment developpes

4. **Score de conformite** - Pourcentage global de couverture du syllabus

5. **Recommandations d'amelioration** - Actions concretes classees par priorite

Sois precis et objectif.
PROMPT;

                        $result = AiService::chat($systemPrompt, $userMessage, [], 8000);

                        // Extract score
                        $score = null;
                        if (preg_match('/(\d{1,3})\s*%/', $result, $m)) {
                            $score = (int) $m[1];
                        }

                        // Save to history
                        SyllabusVerification::create([
                            'course_title' => $title,
                            'category_id' => $record->category_id,
                            'document_id' => $record->id,
                            'syllabus' => $syllabus,
                            'support' => $support,
                            'result' => $result,
                            'score' => $score,
                        ]);

                        Notification::make()
                            ->title('Verification terminee' . ($score ? " - Score: {$score}%" : ''))
                            ->body('Le resultat a ete sauvegarde dans l\'historique. Consultez la page Verification Syllabus pour voir le detail.')
                            ->success()
                            ->persistent()
                            ->send();
                    }),
                EditAction::make(),
            ])
            ->bulkActions([
                DeleteBulkAction::make(),
            ]);
    }
}
