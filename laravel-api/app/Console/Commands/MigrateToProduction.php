<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\AIProvider;

class MigrateToProduction extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:production 
                            {--admin-email= : Admin email address}
                            {--admin-name= : Admin name}
                            {--site-name= : Site name}
                            {--contact-email= : Contact email}
                            {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate demo data to production-ready configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info('🚀 Migrating to production configuration...');

        if (!$dryRun && app()->environment('production')) {
            if (!$this->confirm('You are running this in production. Continue?')) {
                return 0;
            }
        }

        // Collect configuration
        $config = $this->collectConfiguration();

        if ($dryRun) {
            $this->showDryRunResults($config);
            return 0;
        }

        // Perform migration
        $this->performMigration($config);

        $this->info('✅ Production migration completed!');
        $this->displayPostMigrationInstructions();

        return 0;
    }

    private function collectConfiguration(): array
    {
        $config = [];

        // Admin user configuration
        $config['admin_email'] = $this->option('admin-email') ?: 
            $this->ask('Admin email address', 'admin@yourcompany.com');
        
        $config['admin_name'] = $this->option('admin-name') ?: 
            $this->ask('Admin name', 'Administrator');

        // Site configuration
        $config['site_name'] = $this->option('site-name') ?: 
            $this->ask('Site name', 'AI Chat Widget Platform');
        
        $config['contact_email'] = $this->option('contact-email') ?: 
            $this->ask('Contact email', $config['admin_email']);

        // Check for environment variables
        $config['has_openai'] = !empty(env('OPENAI_API_KEY')) && !str_starts_with(env('OPENAI_API_KEY'), 'demo-');
        $config['has_anthropic'] = !empty(env('ANTHROPIC_API_KEY')) && !str_starts_with(env('ANTHROPIC_API_KEY'), 'demo-');
        $config['has_gemini'] = !empty(env('GEMINI_API_KEY')) && !str_starts_with(env('GEMINI_API_KEY'), 'demo-');

        return $config;
    }

    private function showDryRunResults(array $config): void
    {
        $this->info('🔍 Dry run - Changes that would be made:');

        $this->line("\n📧 Admin User:");
        $this->line("  Email: {$config['admin_email']}");
        $this->line("  Name: {$config['admin_name']}");

        $this->line("\n🌐 Site Settings:");
        $this->line("  Site Name: {$config['site_name']}");
        $this->line("  Contact Email: {$config['contact_email']}");

        $this->line("\n🤖 AI Providers:");
        $this->line("  OpenAI: " . ($config['has_openai'] ? '✅ Configured' : '❌ Not configured'));
        $this->line("  Anthropic: " . ($config['has_anthropic'] ? '✅ Configured' : '❌ Not configured'));
        $this->line("  Gemini: " . ($config['has_gemini'] ? '✅ Configured' : '❌ Not configured'));

        if (!$config['has_openai'] && !$config['has_anthropic'] && !$config['has_gemini']) {
            $this->warn("\n⚠️  No AI providers configured! Please set environment variables:");
            $this->line("  - OPENAI_API_KEY=your-openai-key");
            $this->line("  - ANTHROPIC_API_KEY=your-anthropic-key");
            $this->line("  - GEMINI_API_KEY=your-gemini-key");
        }

        $this->line("\n🗑️  Demo data that would be removed:");
        $this->line("  - Demo AI providers");
        $this->line("  - Example.com email addresses");
        $this->line("  - Test/demo widgets");
        $this->line("  - Demo system settings");
    }

    private function performMigration(array $config): void
    {
        // 1. Update or create admin user
        $this->updateAdminUser($config);

        // 2. Update system settings
        $this->updateSystemSettings($config);

        // 3. Clean up demo data
        $this->cleanupDemoData();

        // 4. Initialize production settings
        $this->initializeProductionSettings();
    }

    private function updateAdminUser(array $config): void
    {
        $this->info('👤 Updating admin user...');

        $adminUser = User::where('email', 'admin@example.com')->first();
        
        if ($adminUser) {
            $adminUser->update([
                'email' => $config['admin_email'],
                'name' => $config['admin_name'],
                'email_verified_at' => now()
            ]);
            $this->line("  ✅ Updated existing admin user");
        } else {
            User::create([
                'name' => $config['admin_name'],
                'email' => $config['admin_email'],
                'password' => bcrypt('password'), // User should change this
                'email_verified_at' => now(),
                'role' => 'admin'
            ]);
            $this->line("  ✅ Created new admin user");
        }
    }

    private function updateSystemSettings(array $config): void
    {
        $this->info('⚙️  Updating system settings...');

        $settings = [
            'site.name' => $config['site_name'],
            'site.contact_email' => $config['contact_email'],
            'site.description' => 'Professional AI-powered chat widgets for your business',
            'site.maintenance_mode' => false,
        ];

        foreach ($settings as $key => $value) {
            SystemSetting::set($key, $value);
            $this->line("  ✅ Updated {$key}");
        }
    }

    private function cleanupDemoData(): void
    {
        $this->info('🧹 Cleaning up demo data...');

        // Remove demo AI providers
        $demoProviders = AIProvider::where('api_key', 'like', 'demo-%')->get();
        foreach ($demoProviders as $provider) {
            $provider->delete();
            $this->line("  🗑️  Removed demo {$provider->provider_type} provider");
        }

        // Update demo email addresses
        $demoUsers = User::where('email', 'like', '%@example.com')
            ->where('email', '!=', 'admin@example.com')
            ->get();
            
        foreach ($demoUsers as $user) {
            // Only remove if they have no real data
            if ($user->widgets()->count() === 0) {
                $user->delete();
                $this->line("  🗑️  Removed demo user: {$user->email}");
            }
        }
    }

    private function initializeProductionSettings(): void
    {
        $this->info('🔧 Initializing production settings...');

        // Security settings
        SystemSetting::set('security.session_timeout', 8, 'integer', 'Session timeout in hours', 'security');
        SystemSetting::set('security.login_attempts', 3, 'integer', 'Max login attempts', 'security');
        
        // Notification settings
        SystemSetting::set('notifications.email_notifications', true, 'boolean', 'Enable email notifications', 'notifications');
        SystemSetting::set('notifications.security_alerts', true, 'boolean', 'Enable security alerts', 'notifications');
        
        $this->line("  ✅ Production security settings applied");
    }

    private function displayPostMigrationInstructions(): void
    {
        $this->info("\n📋 Post-migration checklist:");
        $this->line("1. 🔑 Change the admin password");
        $this->line("2. 🔐 Configure AI provider API keys in .env");
        $this->line("3. 📧 Set up email configuration");
        $this->line("4. 🛡️  Review security settings");
        $this->line("5. 🎨 Customize widget default configurations");
        $this->line("6. 📊 Set up analytics and monitoring");
        
        $this->warn("\n⚠️  Important: The admin password is currently 'password' - change it immediately!");
        
        if (!env('OPENAI_API_KEY') || str_starts_with(env('OPENAI_API_KEY'), 'demo-')) {
            $this->warn("⚠️  No valid AI provider API keys found. Configure them in .env file.");
        }
    }
}
