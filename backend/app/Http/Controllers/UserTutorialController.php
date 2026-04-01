<?php

namespace App\Http\Controllers;

use App\Models\UserTutorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserTutorialController extends Controller
{
    /**
     * Get completed tutorials for the current user.
     */
    public function index()
    {
        $tutorials = UserTutorial::where('user_id', Auth::id())
            ->pluck('tutorial_id');

        return response()->json($tutorials);
    }

    /**
     * Mark a tutorial as completed.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tutorial_id' => 'required|string',
        ]);

        $tutorial = UserTutorial::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'tutorial_id' => $request->tutorial_id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Tutorial completed successfully',
            'tutorial' => $tutorial
        ]);
    }
}
