<?php

namespace App\Filament\Resources\Categories\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class CategoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                Select::make('filiere_name')
                    ->label('Filiere parente')
                    ->options([
                        'Genie Informatique'              => 'Genie Informatique',
                        'Commerce, Vente et Gestion'      => 'Commerce, Vente et Gestion',
                        'Genie Civil et Genie Thermique'  => 'Genie Civil et Genie Thermique',
                        'Sante'                           => 'Sante',
                        'Genie Electrique'                => 'Genie Electrique',
                        'Genie Mecanique et Productique'  => 'Genie Mecanique et Productique',
                        'Agriculture et Elevage'          => 'Agriculture et Elevage',
                        'Art, Tourisme et Hotellerie'     => 'Art, Tourisme et Hotellerie',
                    ])
                    ->nullable()
                    ->searchable(),
                Textarea::make('description')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('icon')
                    ->required()
                    ->default('fas fa-laptop-code'),
                FileUpload::make('image')
                    ->image(),
                TextInput::make('api_slug')
                    ->default(null),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
