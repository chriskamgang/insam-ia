<?php

namespace App\Filament\Resources\Videos\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class VideoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->required(),
                Textarea::make('description')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('filename')
                    ->required(),
                TextInput::make('thumbnail')
                    ->default(null),
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                TextInput::make('views_count')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('duration')
                    ->default(null),
            ]);
    }
}
