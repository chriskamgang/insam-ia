<?php

namespace App\Filament\Resources\Exams\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ExamsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->limit(40),
                TextColumn::make('category.name')
                    ->label('Categorie')
                    ->searchable(),
                TextColumn::make('ue.nom')
                    ->label('UE')
                    ->searchable()
                    ->placeholder('—'),
                TextColumn::make('filiere')
                    ->searchable(),
                TextColumn::make('matiere')
                    ->searchable(),
                TextColumn::make('niveau')
                    ->searchable(),
                TextColumn::make('annee')
                    ->label('Annee'),
                IconColumn::make('is_corrected')
                    ->boolean()
                    ->label('Corrige'),
                TextColumn::make('source')
                    ->badge(),
                TextColumn::make('downloads_count')
                    ->numeric()
                    ->sortable()
                    ->label('DL'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
