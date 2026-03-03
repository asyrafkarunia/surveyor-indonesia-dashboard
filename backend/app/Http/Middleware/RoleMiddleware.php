<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Check both database role and dynamic roleName
        $isMatch = false;
        foreach ($roles as $role) {
            if ($user->role === $role) {
                $isMatch = true;
                break;
            }
            
            // Map custom roleNames to standard roles
            if ($role === 'general_manager' && $user->roleName === 'General Manager') {
                $isMatch = true;
                break;
            }
            if ($role === 'senior_manager' && $user->roleName === 'Senior Manager') {
                $isMatch = true;
                break;
            }
        }

        if (!$isMatch) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
