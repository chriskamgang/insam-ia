<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class AiConfiguration extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;
    protected static ?string $navigationLabel = 'Configuration IA';
    protected static ?string $title = 'Configuration IA';
    protected static ?int $navigationSort = 100;

    protected string $view = 'filament.pages.ai-configuration';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'ai_provider' => Setting::get('ai_provider', 'claude'),
            'anthropic_api_key' => Setting::get('anthropic_api_key', ''),
            'claude_model' => Setting::get('claude_model', 'claude-haiku-4-5-20251001'),
            'gemini_api_key' => Setting::get('gemini_api_key', ''),
            'gemini_model' => Setting::get('gemini_model', 'gemini-2.5-flash'),
            'site_name' => Setting::get('site_name', 'INSAM-IA'),
            'site_subtitle' => Setting::get('site_subtitle', ''),
            'contact_email' => Setting::get('contact_email', ''),
            'whatsapp_bot_active' => Setting::get('whatsapp_bot_active', '1') === '1',
            'whatsapp_bot_name' => Setting::get('whatsapp_bot_name', 'INSAM-IA'),
            'whatsapp_custom_info' => Setting::get('whatsapp_custom_info', ''),
            'baileys_url' => Setting::get('baileys_url', 'http://localhost:3001'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Fournisseur IA')
                    ->description('Choisissez le fournisseur d\'IA et configurez les cles API.')
                    ->icon('heroicon-o-cpu-chip')
                    ->schema([
                        Select::make('ai_provider')
                            ->label('Fournisseur IA actif')
                            ->options([
                                'claude' => 'Claude (Anthropic)',
                                'gemini' => 'Gemini (Google)',
                            ])
                            ->required()
                            ->native(false),
                    ]),

                Section::make('Claude (Anthropic)')
                    ->description('Configuration pour l\'API Claude d\'Anthropic.')
                    ->icon('heroicon-o-sparkles')
                    ->schema([
                        TextInput::make('anthropic_api_key')
                            ->label('Cle API Anthropic')
                            ->placeholder('sk-ant-api03-...')
                            ->password()
                            ->revealable()
                            ->helperText('Obtenez votre cle sur console.anthropic.com'),

                        Select::make('claude_model')
                            ->label('Modele Claude')
                            ->options([
                                'claude-haiku-4-5-20251001' => 'Claude Haiku 4.5 (rapide, economique)',
                                'claude-sonnet-4-6' => 'Claude Sonnet 4.6 (equilibre)',
                                'claude-opus-4-6' => 'Claude Opus 4.6 (puissant)',
                            ])
                            ->native(false),
                    ]),

                Section::make('Gemini (Google)')
                    ->description('Configuration pour l\'API Gemini de Google.')
                    ->icon('heroicon-o-globe-alt')
                    ->schema([
                        TextInput::make('gemini_api_key')
                            ->label('Cle API Gemini')
                            ->placeholder('AIzaSy...')
                            ->password()
                            ->revealable()
                            ->helperText('Obtenez votre cle sur aistudio.google.com'),

                        Select::make('gemini_model')
                            ->label('Modele Gemini')
                            ->options([
                                'gemini-2.5-flash' => 'Gemini 2.5 Flash (rapide)',
                                'gemini-2.5-pro' => 'Gemini 2.5 Pro (avance)',
                            ])
                            ->native(false),
                    ]),

                Section::make('WhatsApp Bot')
                    ->description('Configuration du chatbot WhatsApp connecte via Baileys.')
                    ->icon('heroicon-o-chat-bubble-left-right')
                    ->schema([
                        Toggle::make('whatsapp_bot_active')
                            ->label('Bot WhatsApp actif')
                            ->helperText('Activer/desactiver les reponses automatiques sur WhatsApp.'),

                        TextInput::make('whatsapp_bot_name')
                            ->label('Nom du bot')
                            ->placeholder('INSAM-IA'),

                        TextInput::make('baileys_url')
                            ->label('URL du bridge Baileys')
                            ->placeholder('http://localhost:3001')
                            ->helperText('Adresse du service Baileys (whatsapp-bridge).'),

                        Textarea::make('whatsapp_custom_info')
                            ->label('Informations supplementaires pour le bot')
                            ->placeholder('Ajoutez des infos que le bot doit connaitre : horaires, adresse, tarifs...')
                            ->rows(4)
                            ->helperText('Ces infos seront ajoutees au contexte de l\'IA pour WhatsApp.'),
                    ]),

                Section::make('Parametres du site')
                    ->description('Informations generales du site.')
                    ->icon('heroicon-o-building-office')
                    ->schema([
                        TextInput::make('site_name')
                            ->label('Nom du site'),

                        TextInput::make('site_subtitle')
                            ->label('Sous-titre'),

                        TextInput::make('contact_email')
                            ->label('Email de contact')
                            ->email(),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        foreach ($data as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
            Setting::set($key, $value ?? '');
        }

        Notification::make()
            ->title('Configuration sauvegardee')
            ->body('Les parametres IA ont ete mis a jour avec succes.')
            ->success()
            ->send();
    }
}
