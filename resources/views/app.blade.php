<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>INSAM-IA - Votre assistant académique intelligent</title>
    <meta name="description" content="INSAM-IA est votre plateforme d'apprentissage intelligent. Accédez à vos cours, suivez votre progression et boostez vos résultats avec l'aide de l'IA.">

    <!-- Open Graph / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://insam-ia.com">
    <meta property="og:title" content="INSAM-IA - Votre assistant académique intelligent">
    <meta property="og:description" content="Plateforme d'apprentissage intelligent de l'INSAM. Accédez à vos cours, suivez votre progression et boostez vos résultats avec l'aide de l'IA.">
    <meta property="og:image" content="https://insam-ia.com/images/logo.jpeg">
    <meta property="og:site_name" content="INSAM-IA">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="INSAM-IA - Votre assistant académique intelligent">
    <meta name="twitter:description" content="Plateforme d'apprentissage intelligent de l'INSAM. Cours, progression, IA.">
    <meta name="twitter:image" content="https://insam-ia.com/images/logo.jpeg">

    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#49BBBD">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="INSAM-IA">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
