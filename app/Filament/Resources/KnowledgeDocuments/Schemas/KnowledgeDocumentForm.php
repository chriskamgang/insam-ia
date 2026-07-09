<?php

namespace App\Filament\Resources\KnowledgeDocuments\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class KnowledgeDocumentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->required(),
                TextInput::make('filename')
                    ->required(),
                Textarea::make('content')
                    ->required()
                    ->columnSpanFull(),
                Select::make('type')
                    ->options(['pdf' => 'Pdf', 'text' => 'Text', 'course' => 'Course'])
                    ->required(),
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->default(null),
            ]);
    }
}
