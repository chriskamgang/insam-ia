<?php

namespace App\Filament\Resources\KnowledgeDocuments\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class KnowledgeDocumentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Document')
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->label('Titre du document')
                            ->placeholder('Ex: Programme BTS Informatique 2024'),
                        Select::make('type')
                            ->options([
                                'pdf' => 'PDF',
                                'doc' => 'Word (DOC/DOCX)',
                                'txt' => 'Texte',
                                'course' => 'Cours',
                                'image' => 'Image',
                                'spreadsheet' => 'Tableur',
                                'other' => 'Autre',
                            ])
                            ->default('pdf')
                            ->required()
                            ->label('Type'),
                        FileUpload::make('file_path')
                            ->label('Fichier')
                            ->directory('knowledge')
                            ->acceptedFileTypes([
                                'application/pdf',
                                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                                'application/msword',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                'application/vnd.ms-excel',
                                'application/vnd.ms-powerpoint',
                                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                'text/plain', 'text/csv',
                            ])
                            ->maxSize(51200)
                            ->helperText('PDF, Word, Excel, PowerPoint, images, texte. Max 50 Mo. Le contenu sera extrait automatiquement.'),
                        TextInput::make('filename')
                            ->label('Nom du fichier (optionnel)')
                            ->placeholder('Rempli automatiquement si vide'),
                    ])->columns(2),

                Section::make('Contenu texte')
                    ->description('Le contenu est extrait automatiquement du fichier. Vous pouvez aussi le saisir ou le modifier manuellement.')
                    ->schema([
                        Textarea::make('content')
                            ->label('Contenu')
                            ->rows(10)
                            ->nullable()
                            ->columnSpanFull(),
                    ])->collapsible(),

                Section::make('Classification')
                    ->schema([
                        Select::make('category_id')
                            ->relationship('category', 'name')
                            ->label('Specialite / Categorie')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                        Select::make('ue_id')
                            ->relationship('uniteEnseignement', 'nom')
                            ->label('Unite d\'Enseignement')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ])->columns(2),
            ]);
    }
}
