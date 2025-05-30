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
        Schema::create('a_i_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('provider_type'); // openai, gemini, claude, mistral, etc.
            $table->text('api_key'); // encrypted
            $table->string('model');
            $table->float('temperature')->default(0.7);
            $table->integer('max_tokens')->default(2048);
            $table->text('system_prompt')->nullable();
            $table->json('advanced_settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('a_i_providers');
    }
};
