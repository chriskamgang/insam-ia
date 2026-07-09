<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin INSAM',
            'nom' => 'Admin',
            'prenom' => 'INSAM',
            'email' => 'admin@insam-ia.cm',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'locale' => 'fr',
        ]);

        // Demo student
        User::create([
            'name' => 'Etudiant Demo',
            'nom' => 'Demo',
            'prenom' => 'Etudiant',
            'email' => 'etudiant@insam-ia.cm',
            'password' => Hash::make('password'),
            'role' => 'student',
            'locale' => 'fr',
        ]);

        // Default categories (from INSAM-Videos)
        $categories = [
            ['name' => 'Genie Logiciel', 'description' => 'Developpement web, mobile et logiciel', 'icon' => 'fas fa-laptop-code', 'sort_order' => 1],
            ['name' => 'Reseaux & Telecoms', 'description' => 'Administration reseaux, securite et telecoms', 'icon' => 'fas fa-network-wired', 'sort_order' => 2],
            ['name' => 'Genie Civil', 'description' => 'Construction, BTP et urbanisme', 'icon' => 'fas fa-hard-hat', 'sort_order' => 3],
            ['name' => 'Comptabilite & Gestion', 'description' => 'Finance, comptabilite et management', 'icon' => 'fas fa-chart-line', 'sort_order' => 4],
            ['name' => 'Marketing & Commerce', 'description' => 'Marketing digital, commerce et vente', 'icon' => 'fas fa-bullhorn', 'sort_order' => 5],
            ['name' => 'Banque & Finance', 'description' => 'Operations bancaires et finance', 'icon' => 'fas fa-university', 'sort_order' => 6],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // Default settings
        $settings = [
            'site_name' => 'INSAM-IA',
            'site_subtitle' => 'Institut Universitaire et Strategique de l\'Estuaire',
            'ai_provider' => 'claude',
            'claude_model' => 'claude-haiku-4-5-20251001',
            'gemini_model' => 'gemini-2.5-flash',
            'contact_email' => 'contact@insam-ia.cm',
        ];

        foreach ($settings as $key => $value) {
            Setting::set($key, $value);
        }

        // Default plans
        Plan::create([
            'name' => 'Gratuit',
            'slug' => 'free',
            'description' => 'Accès de base à la plateforme',
            'price' => 0,
            'billing_cycle' => 'monthly',
            'features' => ['Assistant IA (5 messages/jour)', 'Accès aux vidéos', 'Quiz de base', 'Consultation des sujets'],
            'limits' => ['ai_chats_per_day' => 5, 'predictions_per_month' => 1, 'revision_cards_per_month' => 2, 'simulations_per_month' => 2],
            'sort_order' => 1,
        ]);

        Plan::create([
            'name' => 'Premium',
            'slug' => 'premium',
            'description' => 'Accès complet pour réussir vos examens',
            'price' => 2500,
            'billing_cycle' => 'monthly',
            'features' => ['Assistant IA illimité', 'Prédictions d\'examens', 'Fiches de révision illimitées', 'Simulations illimitées', 'Rapports de progression', 'Planification IA', 'Support prioritaire'],
            'limits' => ['ai_chats_per_day' => 100, 'predictions_per_month' => 20, 'revision_cards_per_month' => 50, 'simulations_per_month' => 50],
            'sort_order' => 2,
        ]);

        Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'description' => 'Pour les étudiants les plus ambitieux',
            'price' => 5000,
            'billing_cycle' => 'monthly',
            'features' => ['Tout Premium', 'Corrections détaillées par IA', 'Marketplace vendeur', 'Mode hors ligne', 'Accès anticipé aux nouvelles fonctionnalités'],
            'limits' => ['ai_chats_per_day' => 999, 'predictions_per_month' => 999, 'revision_cards_per_month' => 999, 'simulations_per_month' => 999],
            'sort_order' => 3,
        ]);
    }
}
