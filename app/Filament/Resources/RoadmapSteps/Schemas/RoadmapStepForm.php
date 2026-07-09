<?php

namespace App\Filament\Resources\RoadmapSteps\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class RoadmapStepForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                TextInput::make('step_number')
                    ->required()
                    ->numeric(),
                TextInput::make('title')
                    ->required(),
                Textarea::make('description')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('level')
                    ->required()
                    ->default('Debutant'),
                TextInput::make('duration')
                    ->default(null),
                Textarea::make('skills')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('icon')
                    ->default(null),
                TextInput::make('color')
                    ->default(null),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
