<?php

namespace App\Filament\Resources\Videos\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class VideoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informations')
                    ->schema([
                        TextInput::make('title')
                            ->label('Titre')
                            ->required(),
                        Select::make('category_id')
                            ->relationship('category', 'name')
                            ->label('Categorie')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Textarea::make('description')
                            ->label('Description')
                            ->default(null)
                            ->columnSpanFull(),
                        TextInput::make('duration')
                            ->label('Duree (ex: 15:30)')
                            ->default(null),
                        TextInput::make('views_count')
                            ->label('Nombre de vues')
                            ->numeric()
                            ->default(0),
                    ])->columns(2),

                Section::make('Fichiers')
                    ->schema([
                        FileUpload::make('filename')
                            ->label('Fichier video')
                            ->directory('videos')
                            ->acceptedFileTypes(['video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/mkv'])
                            ->maxSize(512000)
                            ->required()
                            ->columnSpanFull(),
                        FileUpload::make('thumbnail')
                            ->label('Image miniature')
                            ->image()
                            ->directory('videos/thumbnails')
                            ->imageResizeTargetWidth('640')
                            ->imageResizeTargetHeight('360')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
