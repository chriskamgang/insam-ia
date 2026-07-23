<?php

namespace App\Filament\Resources\HeroMedia;

use App\Filament\Resources\HeroMedia\Pages\CreateHeroMedia;
use App\Filament\Resources\HeroMedia\Pages\EditHeroMedia;
use App\Filament\Resources\HeroMedia\Pages\ListHeroMedia;
use App\Models\HeroMedia;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HeroMediaResource extends Resource
{
    protected static ?string $model = HeroMedia::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPhoto;

    protected static ?string $navigationLabel = 'Hero Media';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('type')
                    ->options([
                        'image' => 'Image',
                        'video' => 'Video',
                    ])
                    ->default('image')
                    ->required(),
                FileUpload::make('filename')
                    ->directory('hero')
                    ->image()
                    ->required(),
                TextInput::make('title'),
                TextInput::make('sort_order')
                    ->numeric()
                    ->default(0),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('filename')
                    ->label('Image')
                    ->disk('public'),
                TextColumn::make('title'),
                TextColumn::make('type'),
                TextColumn::make('sort_order')
                    ->sortable(),
            ])
            ->defaultSort('sort_order');
    }

    public static function getPages(): array
    {
        return [
            'index' => ListHeroMedia::route('/'),
            'create' => CreateHeroMedia::route('/create'),
            'edit' => EditHeroMedia::route('/{record}/edit'),
        ];
    }
}
