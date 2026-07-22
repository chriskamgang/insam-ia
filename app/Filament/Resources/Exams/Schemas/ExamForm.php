<?php

namespace App\Filament\Resources\Exams\Schemas;

use App\Models\Specialite;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ExamForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informations de l\'epreuve')
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->label('Titre de l\'epreuve'),
                        Select::make('category_id')
                            ->relationship('category', 'name')
                            ->label('Categorie / Formation')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                        Select::make('filiere')
                            ->options(fn () => Specialite::orderBy('name')->pluck('name', 'name')->toArray())
                            ->label('Specialite (Filiere)')
                            ->searchable()
                            ->nullable(),
                        TextInput::make('matiere')
                            ->label('Matiere')
                            ->nullable(),
                        Select::make('niveau')
                            ->options([
                                'BTS 1ere annee' => 'BTS 1ere annee',
                                'BTS 2eme annee' => 'BTS 2eme annee',
                                'Licence 1' => 'Licence 1',
                                'Licence 2' => 'Licence 2',
                                'Licence 3' => 'Licence 3',
                                'Master 1' => 'Master 1',
                                'Master 2' => 'Master 2',
                            ])
                            ->label('Niveau')
                            ->nullable(),
                        TextInput::make('annee')
                            ->label('Annee scolaire')
                            ->placeholder('Ex: 2024-2025')
                            ->nullable(),
                    ])->columns(2),

                Section::make('Fichiers')
                    ->schema([
                        FileUpload::make('file_path')
                            ->label('Fichier de l\'epreuve')
                            ->directory('exams')
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
                            ->maxSize(20480)
                            ->required(),
                        FileUpload::make('correction_path')
                            ->label('Fichier de correction')
                            ->directory('exams/corrections')
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
                            ->maxSize(20480)
                            ->nullable(),
                        Toggle::make('is_corrected')
                            ->label('Correction disponible'),
                    ])->columns(2),

                Section::make('Metadata')
                    ->schema([
                        Select::make('source')
                            ->options(['admin' => 'Admin', 'student' => 'Etudiant'])
                            ->default('admin')
                            ->required(),
                        TextInput::make('downloads_count')
                            ->label('Telechargements')
                            ->numeric()
                            ->default(0),
                    ])->columns(2)->collapsed(),
            ]);
    }
}
