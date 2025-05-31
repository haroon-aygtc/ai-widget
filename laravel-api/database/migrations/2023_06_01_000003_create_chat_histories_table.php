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
            $table->string('session_id')->unique();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->string('user_phone')->nullable();
            $table->json('user_data')->nullable();
            $table->enum('status', ['active', 'ended', 'archived'])->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->integer('message_count')->default(0);
            $table->float('total_response_time')->default(0);
            $table->float('avg_response_time')->default(0);
            $table->timestamps();

            $table->index(['widget_id', 'created_at']);
            $table->index(['session_id']);
            $table->index(['status', 'last_message_at']);
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
