<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('nom')
                    ->default(null),
                TextInput::make('prenom')
                    ->default(null),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                DateTimePicker::make('email_verified_at'),
                TextInput::make('password')
                    ->password()
                    ->required(),
                TextInput::make('telephone')
                    ->tel()
                    ->default(null),
                TextInput::make('filiere')
                    ->default(null),
                Select::make('role')
                    ->options(['student' => 'Student', 'teacher' => 'Teacher', 'admin' => 'Admin'])
                    ->default('student')
                    ->required(),
                TextInput::make('avatar')
                    ->default(null),
                TextInput::make('locale')
                    ->required()
                    ->default('fr'),
            ]);
    }
}
