<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->string('type')->default('string'); // string, integer, boolean, json, array
            $table->text('description')->nullable();
            $table->string('category')->default('general');
            $table->boolean('is_public')->default(false); // Whether setting can be exposed to frontend
            $table->timestamps();

            $table->index(['category']);
            $table->index(['is_public']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
