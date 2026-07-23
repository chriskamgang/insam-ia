<?php

namespace App\Filament\Resources\Specialites;

use App\Filament\Resources\Specialites\Pages\CreateSpecialite;
use App\Filament\Resources\Specialites\Pages\EditSpecialite;
use App\Filament\Resources\Specialites\Pages\ListSpecialites;
use App\Models\Specialite;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class SpecialiteResource extends Resource
{
    protected static ?string $model = Specialite::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedAcademicCap;

    protected static string|\UnitEnum|null $navigationGroup = 'Orientation';

    protected static ?string $navigationLabel = 'Specialites';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informations')->schema([
                Select::make('filiere_id')
                    ->relationship('filiere', 'name')
                    ->required()
                    ->label('Filiere')
                    ->searchable()
                    ->preload(),
                TextInput::make('name')->required()->label('Nom de la specialite'),
                Textarea::make('description')->label('Description')->columnSpanFull(),
                TextInput::make('diplome')->label('Diplome (ex: BTS, Licence, Master)'),
                TextInput::make('duree')->label('Duree (ex: 2 ans, 3 ans)'),
                TextInput::make('icon')->label('Icone (classe FontAwesome)')->placeholder('fas fa-code'),
                TextInput::make('sort_order')->numeric()->default(0)->label('Ordre'),
            ])->columns(2),
            Section::make('Details')->schema([
                Textarea::make('avantages')->label('Avantages')->rows(4),
                Textarea::make('debouches')->label('Debouches')->rows(4),
                Textarea::make('competences')->label('Competences acquises')->rows(4),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('filiere.ecole.name')->sortable()->label('Ecole'),
            TextColumn::make('filiere.name')->sortable()->label('Filiere'),
            TextColumn::make('name')->searchable()->sortable()->label('Specialite'),
            TextColumn::make('diplome')->label('Diplome'),
            TextColumn::make('duree')->label('Duree'),
        ])
        ->defaultSort('filiere_id')
        ->filters([
            SelectFilter::make('filiere_id')
                ->relationship('filiere', 'name')
                ->label('Filiere'),
        ])
        ->actions([EditAction::make()])
        ->bulkActions([DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSpecialites::route('/'),
            'create' => CreateSpecialite::route('/create'),
            'edit' => EditSpecialite::route('/{record}/edit'),
        ];
    }
}
