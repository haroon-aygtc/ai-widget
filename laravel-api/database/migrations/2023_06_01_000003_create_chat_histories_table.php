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
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widget_id')->constrained()->onDelete('cascade');
            $table->string('session_id');
            $table->string('user_identifier')->nullable(); // email, name, or other identifier
            $table->text('message');
            $table->text('response');
            $table->string('sender_type'); // user or ai
            $table->json('metadata')->nullable(); // additional data like tokens used, model, etc.
            $table->timestamps();
            
            $table->index('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_histories');
    }
};
