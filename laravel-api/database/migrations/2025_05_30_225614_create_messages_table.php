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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->index();
            $table->foreignId('widget_id')->constrained()->onDelete('cascade');
            $table->enum('sender_type', ['user', 'ai']);
            $table->text('message')->nullable();
            $table->text('response')->nullable();
            $table->json('user_data')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->float('response_time')->nullable();
            $table->json('token_usage')->nullable();
            $table->string('model_used')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
            $table->index(['widget_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
