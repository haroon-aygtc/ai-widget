<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if we're in production and prevent demo data
        if (app()->environment('production') && env('ALLOW_DEMO_DATA', false) !== true) {
            $this->command->warn('Skipping system settings seeding in production environment.');
            $this->command->info('System settings will be initialized on first use.');
            return;
        }

        $this->command->info('Initializing system settings...');
        
        SystemSetting::initializeDefaults();
        
        $this->command->info('System settings initialized successfully.');
    }
}
