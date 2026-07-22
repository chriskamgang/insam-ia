<?php

namespace App\Filament\Resources\OrientationQuestions;

use App\Filament\Resources\OrientationQuestions\Pages\CreateOrientationQuestion;
use App\Filament\Resources\OrientationQuestions\Pages\EditOrientationQuestion;
use App\Filament\Resources\OrientationQuestions\Pages\ListOrientationQuestions;
use App\Models\OrientationQuestion;
use BackedEnum;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Repeater;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrientationQuestionResource extends Resource
{
    protected static ?string $model = OrientationQuestion::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedQuestionMarkCircle;

    protected static string|\UnitEnum|null $navigationGroup = 'Orientation';

    protected static ?string $navigationLabel = 'Questions';

    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Question')->schema([
                Select::make('level')
                    ->options([
                        'filiere' => 'Niveau Filiere (pour determiner la filiere)',
                        'specialite' => 'Niveau Specialite (pour determiner la specialite)',
                    ])
                    ->required()
                    ->label('Niveau de la question'),
                Select::make('ecole_id')
                    ->relationship('ecole', 'name')
                    ->label('Ecole (si specifique)')
                    ->searchable()
                    ->preload()
                    ->nullable(),
                Select::make('filiere_id')
                    ->relationship('filiere', 'name')
                    ->label('Filiere (pour questions de specialite)')
                    ->searchable()
                    ->preload()
                    ->nullable(),
                TextInput::make('question')
                    ->required()
                    ->label('Question')
                    ->columnSpanFull(),
                TextInput::make('sort_order')->numeric()->default(0)->label('Ordre'),
            ])->columns(2),
            Section::make('Options et Scores')
                ->description('Chaque option a un score par filiere/specialite. Ex: option "J\'aime les chiffres" → score {"Comptabilite & Gestion": 3, "Marketing": 1}')
                ->schema([
                    Repeater::make('options')
                        ->schema([
                            TextInput::make('label')->required()->label('Option de reponse'),
                        ])
                        ->label('Options de reponse')
                        ->defaultItems(4)
                        ->columnSpanFull(),
                    KeyValue::make('scores')
                        ->label('Scores par filiere/specialite')
                        ->keyLabel('Filiere ou Specialite')
                        ->valueLabel('Poids (numero)')
                        ->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('level')->badge()->label('Niveau'),
            TextColumn::make('ecole.name')->label('Ecole')->default('-'),
            TextColumn::make('filiere.name')->label('Filiere')->default('-'),
            TextColumn::make('question')->searchable()->limit(60)->label('Question'),
            TextColumn::make('sort_order')->label('Ordre')->sortable(),
        ])
        ->defaultSort('sort_order')
        ->filters([
            SelectFilter::make('level')->options([
                'filiere' => 'Filiere',
                'specialite' => 'Specialite',
            ]),
            SelectFilter::make('ecole_id')
                ->relationship('ecole', 'name')
                ->label('Ecole'),
        ])
        ->actions([EditAction::make()])
        ->bulkActions([DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrientationQuestions::route('/'),
            'create' => CreateOrientationQuestion::route('/create'),
            'edit' => EditOrientationQuestion::route('/{record}/edit'),
        ];
    }
}
