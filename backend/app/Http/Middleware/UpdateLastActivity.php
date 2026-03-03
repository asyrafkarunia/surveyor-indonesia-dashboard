<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            /** @var \App\Models\User $user */
            $user = auth()->user();
            $user->last_activity_at = now();
            $user->is_online = true;
            $user->save();
        }
        return $next($request);
    }
}