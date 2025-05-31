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
        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ai_provider_id')->nullable()->constrained('ai_providers')->onDelete('set null');
            $table->string('name');
            $table->string('model_id')->comment('The actual model identifier used by the provider');
            $table->string('provider_type');
            $table->text('description')->nullable();
            $table->float('temperature')->default(0.7);
            $table->integer('max_tokens')->default(1000);
            $table->text('system_prompt')->nullable();
            $table->json('capabilities')->nullable()->comment('What the model can do (code, vision, etc)');
            $table->json('configuration')->nullable()->comment('Additional configuration parameters');
            $table->json('performance_metrics')->nullable()->comment('Usage statistics and performance data');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            // Add unique constraint for user + model combination
            $table->unique(['user_id', 'model_id', 'provider_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_models');
    }
};
