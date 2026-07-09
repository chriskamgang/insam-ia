<?php

namespace App\Filament\Resources\Exams\Schemas;

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
                TextInput::make('title')
                    ->required(),
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                TextInput::make('filiere')
                    ->default(null),
                TextInput::make('matiere')
                    ->default(null),
                TextInput::make('niveau')
                    ->default(null),
                TextInput::make('annee')
                    ->default(null),
                TextInput::make('file_path')
                    ->required(),
                TextInput::make('correction_path')
                    ->default(null),
                Toggle::make('is_corrected')
                    ->required(),
                TextInput::make('uploaded_by')
                    ->numeric()
                    ->default(null),
                Select::make('source')
                    ->options(['admin' => 'Admin', 'student' => 'Student'])
                    ->default('admin')
                    ->required(),
                TextInput::make('downloads_count')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
