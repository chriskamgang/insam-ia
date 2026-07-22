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
                        Select::make('exam_type')
                            ->options([
                                'bts' => 'Epreuve BTS',
                                'licence' => 'Epreuve Licence / Master / Autre',
                            ])
                            ->default('bts')
                            ->required()
                            ->label('Type d\'epreuve')
                            ->reactive(),
                        TextInput::make('title')
                            ->required()
                            ->label('Titre de l\'epreuve'),
                        Select::make('category_id')
                            ->relationship('category', 'name')
                            ->label('Specialite')
                            ->searchable()
                            ->preload()
                            ->nullable(),

                        // Champs Licence/Master uniquement
                        Select::make('ue_id')
                            ->relationship('ue', 'nom')
                            ->label('Unite d\'Enseignement')
                            ->searchable()
                            ->preload()
                            ->nullable()
                            ->visible(fn ($get) => $get('exam_type') !== 'bts'),
                        Select::make('filiere')
                            ->options(fn () => Specialite::orderBy('name')->pluck('name', 'name')->toArray())
                            ->label('Specialite')
                            ->searchable()
                            ->default(null)
                            ->visible(fn ($get) => $get('exam_type') !== 'bts'),
                        TextInput::make('matiere')
                            ->label('Matiere')
                            ->default(null)
                            ->visible(fn ($get) => $get('exam_type') !== 'bts'),
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
                            ->default(null)
                            ->visible(fn ($get) => $get('exam_type') !== 'bts'),
                        TextInput::make('annee')
                            ->label('Annee scolaire')
                            ->placeholder('Ex: 2024-2025')
                            ->default(null)
                            ->visible(fn ($get) => $get('exam_type') !== 'bts'),
                    ])->columns(2),

                // BTS: multi-select UEs
                Section::make('Unites d\'Enseignement couvertes')
                    ->description('Selectionnez les UE que cette epreuve BTS couvre')
                    ->schema([
                        Select::make('unitesEnseignement')
                            ->relationship('unitesEnseignement', 'nom')
                            ->multiple()
                            ->label('UE couvertes')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ])
                    ->visible(fn ($get) => $get('exam_type') === 'bts'),

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
                            ->default(null),
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
