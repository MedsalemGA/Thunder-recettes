<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // health: '/up',   // optionnel, tu peux le rajouter si tu veux
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(HandleCors::class);
        // Tu peux aussi ajouter d'autres middlewares ici si besoin
        // ex: $middleware->alias([...]);
        $middleware->alias([
        'auth:sanctum' => \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ... autres aliases si besoin
    ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Pour l'instant, laisse vide → ça utilise les handlers par défaut de Laravel
        // Plus tard tu pourras y mettre :
        // $exceptions->reportable(...);
        // $exceptions->render(...);
    })
    ->create();