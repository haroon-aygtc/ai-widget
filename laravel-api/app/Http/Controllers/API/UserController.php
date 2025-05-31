<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Only admin users can see all users
            if (Auth::user()->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = User::query();

            // Apply filters
            if ($request->has('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            }

            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $users = $query->paginate($perPage);

            return response()->json([
                'data' => $users->items(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total()
            ]);
        } catch (\Exception $e) {
            Log::error('User index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Store a newly created user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Only admin users can create users
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,user',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'status' => $request->status ?? 'active',
            ]);

            Log::info('User created', ['user_id' => $user->id, 'created_by' => Auth::id()]);

            return response()->json($user, 201);
        } catch (\Exception $e) {
            Log::error('User creation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create user'], 500);
        }
    }

    /**
     * Display the specified user.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Users can only see their own profile unless they're an admin
            if (Auth::user()->role !== 'admin' && Auth::id() !== (int)$id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $user = User::findOrFail($id);

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('User show error: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Update the specified user.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        // Users can only update their own profile unless they're an admin
        if (Auth::user()->role !== 'admin' && Auth::id() !== (int)$id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|string|in:admin,user',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = User::findOrFail($id);

            // Only admins can change roles
            if (Auth::user()->role !== 'admin' && $request->has('role')) {
                return response()->json(['error' => 'Unauthorized to change role'], 403);
            }

            // Update user data
            if ($request->has('name')) $user->name = $request->name;
            if ($request->has('email')) $user->email = $request->email;
            if ($request->has('password') && $request->password) {
                $user->password = Hash::make($request->password);
            }
            if ($request->has('role') && Auth::user()->role === 'admin') {
                $user->role = $request->role;
            }
            if ($request->has('status') && Auth::user()->role === 'admin') {
                $user->status = $request->status;
            }

            $user->save();

            Log::info('User updated', ['user_id' => $user->id, 'updated_by' => Auth::id()]);

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('User update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }

    /**
     * Remove the specified user.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        // Only admin users can delete users
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $user = User::findOrFail($id);

            // Prevent deleting yourself
            if (Auth::id() === (int)$id) {
                return response()->json(['error' => 'Cannot delete your own account'], 400);
            }

            $user->delete();

            Log::info('User deleted', ['user_id' => $id, 'deleted_by' => Auth::id()]);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('User deletion error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete user'], 500);
        }
    }

    /**
     * Toggle user status (active/inactive).
     *
     * @param string $id
     * @return JsonResponse
     */
    public function toggleStatus(string $id): JsonResponse
    {
        // Only admin users can toggle user status
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $user = User::findOrFail($id);

            // Prevent toggling your own status
            if (Auth::id() === (int)$id) {
                return response()->json(['error' => 'Cannot change your own status'], 400);
            }

            $user->status = $user->status === 'active' ? 'inactive' : 'active';
            $user->save();

            Log::info('User status toggled', [
                'user_id' => $user->id,
                'status' => $user->status,
                'toggled_by' => Auth::id()
            ]);

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('User toggle status error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to toggle user status'], 500);
        }
    }
}
