<?php

namespace App\Filament\Resources\KnowledgeDocuments\Tables;

use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
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
                EditAction::make(),
            ])
            ->bulkActions([
                DeleteBulkAction::make(),
            ]);
    }
}
