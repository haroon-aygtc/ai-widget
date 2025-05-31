<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\AIProviderSeeder;

class SeedAIProviders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:ai-providers {--fresh : Delete existing providers before seeding}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the database with AI provider configurations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('fresh')) {
            $this->info('Clearing existing AI providers...');

            // Disable foreign key checks temporarily
            \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            \App\Models\AIProvider::truncate();
            \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $this->info('Seeding AI providers...');

        $seeder = new AIProviderSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->info('AI providers seeded successfully!');

        return Command::SUCCESS;
    }
}
