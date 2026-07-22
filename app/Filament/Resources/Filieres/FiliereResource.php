<?php

namespace App\Filament\Resources\Filieres;

use App\Filament\Resources\Filieres\Pages\CreateFiliere;
use App\Filament\Resources\Filieres\Pages\EditFiliere;
use App\Filament\Resources\Filieres\Pages\ListFilieres;
use App\Models\Filiere;
use App\Services\OrientationService;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Actions\Action;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class FiliereResource extends Resource
{
    protected static ?string $model = Filiere::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedFolderOpen;

    protected static string|\UnitEnum|null $navigationGroup = 'Orientation';

    protected static ?string $navigationLabel = 'Filieres';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('ecole_id')
                ->relationship('ecole', 'name')
                ->required()
                ->label('Ecole')
                ->searchable()
                ->preload(),
            TextInput::make('name')->required()->label('Nom de la filiere'),
            Textarea::make('description')->label('Description')->columnSpanFull(),
            TextInput::make('icon')->label('Icone (classe FontAwesome)')->placeholder('fas fa-laptop'),
            TextInput::make('sort_order')->numeric()->default(0)->label('Ordre'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('ecole.name')->sortable()->label('Ecole'),
            TextColumn::make('name')->searchable()->sortable()->label('Filiere'),
            TextColumn::make('specialites_count')->counts('specialites')->label('Specialites'),
            TextColumn::make('sort_order')->label('Ordre')->sortable(),
        ])
        ->defaultSort('ecole_id')
        ->filters([
            SelectFilter::make('ecole_id')
                ->relationship('ecole', 'name')
                ->label('Ecole'),
        ])
        ->actions([
            Action::make('generate_questions')
                ->label('Questions IA')
                ->icon('heroicon-o-sparkles')
                ->color('warning')
                ->requiresConfirmation()
                ->modalHeading('Generer les questions de specialite')
                ->modalDescription('L\'IA va generer des questions pour orienter vers les specialites de cette filiere.')
                ->action(function (Filiere $record) {
                    $record->orientationQuestions()->where('level', 'specialite')->delete();
                    $count = OrientationService::generateSpecialiteQuestions($record);

                    Notification::make()
                        ->title("{$count} questions generees")
                        ->success()
                        ->send();
                }),
            EditAction::make(),
        ])
        ->bulkActions([DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListFilieres::route('/'),
            'create' => CreateFiliere::route('/create'),
            'edit' => EditFiliere::route('/{record}/edit'),
        ];
    }
}
