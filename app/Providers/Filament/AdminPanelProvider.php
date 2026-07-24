<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->darkMode(true, true) // Force dark mode
            ->colors([
                'primary' => Color::hex('#8B5CF6'),   // Purple accent
                'gray' => Color::hex('#6B7280'),
                'danger' => Color::Rose,
                'info' => Color::hex('#06B6D4'),      // Cyan
                'success' => Color::Emerald,
                'warning' => Color::Amber,
            ])
            ->brandName('INSAM-IA Admin')
            ->favicon(asset('favicon.ico'))
            ->sidebarCollapsibleOnDesktop()
            ->navigationGroups([
                'Contenu',
                'Etudiants',
                'Configuration',
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
            ])
            ->renderHook('panels::head.end', fn () => new \Illuminate\Support\HtmlString('
                <style>
                    :root { color-scheme: dark; }
                    .fi-body { background: #0f0e17 !important; }
                    .fi-sidebar { background: linear-gradient(180deg, #13122a 0%, #0f0e17 100%) !important; border-right: 1px solid rgba(139,92,246,0.15) !important; }
                    .fi-sidebar-nav-groups { }
                    .fi-sidebar-item { border-radius: 10px !important; }
                    .fi-sidebar-item-active { background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1)) !important; border-left: 3px solid #8B5CF6 !important; }
                    .fi-sidebar-item-active .fi-sidebar-item-label { color: #c4b5fd !important; }
                    .fi-topbar { background: #13122a !important; border-bottom: 1px solid rgba(139,92,246,0.12) !important; }
                    .fi-header { border-bottom: 1px solid rgba(139,92,246,0.1) !important; }
                    .fi-section, .fi-ta-ctn { background: #1a1932 !important; border: 1px solid rgba(139,92,246,0.12) !important; border-radius: 16px !important; }
                    .fi-wi-stats-overview-stat { background: linear-gradient(135deg, #1a1932, #13122a) !important; border: 1px solid rgba(139,92,246,0.15) !important; border-radius: 14px !important; }
                    .fi-wi-stats-overview-stat-value { color: #e2e8f0 !important; font-weight: 800 !important; }
                    .fi-wi-stats-overview-stat-label { color: #94a3b8 !important; }
                    .fi-modal-content { background: #1a1932 !important; }
                    .fi-btn-primary { background: linear-gradient(135deg, #8B5CF6, #06B6D4) !important; }
                    .fi-ta-row:hover td { background: rgba(139,92,246,0.06) !important; }
                    .fi-badge-success { background: rgba(16,185,129,0.15) !important; color: #6ee7b7 !important; }
                    .fi-badge-danger { background: rgba(244,63,94,0.15) !important; color: #fda4af !important; }
                    .fi-badge-warning { background: rgba(245,158,11,0.15) !important; color: #fcd34d !important; }
                    .fi-input-wrp { background: #13122a !important; border-color: rgba(139,92,246,0.2) !important; border-radius: 10px !important; }
                    .fi-fo-select select, .fi-input { background: #13122a !important; color: #e2e8f0 !important; }
                    .dark .fi-sidebar-group-label { color: #8B5CF6 !important; font-weight: 700 !important; text-transform: uppercase !important; font-size: 0.65rem !important; letter-spacing: 0.08em !important; }
                    .fi-logo { font-weight: 800 !important; }
                    .fi-logo span, .fi-logo a { background: linear-gradient(135deg, #8B5CF6, #06B6D4) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; }
                    .fi-wi-chart { background: #1a1932 !important; border: 1px solid rgba(139,92,246,0.12) !important; border-radius: 16px !important; }
                </style>
            '))
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
