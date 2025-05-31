<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AIProvider;
use App\Models\User;
use App\Models\Widget;
use App\Models\Message;
use App\Models\SystemSetting;

class CleanDemoData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:clean {--dry-run : Show what would be cleaned without actually doing it} {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up demo data from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        if (app()->environment('production') && !$force) {
            if (!$this->confirm('You are running this in production. Are you sure you want to continue?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('Scanning for demo data...');

        $cleanupActions = [];

        // Check AI Providers for demo keys
        $demoProviders = AIProvider::where('api_key', 'like', 'demo-%')->get();
        if ($demoProviders->count() > 0) {
            $cleanupActions[] = [
                'type' => 'ai_providers',
                'count' => $demoProviders->count(),
                'description' => 'AI Providers with demo API keys',
                'items' => $demoProviders
            ];
        }

        // Check for demo users
        $demoUsers = User::where('email', 'like', '%@example.com')->get();
        if ($demoUsers->count() > 0) {
            $cleanupActions[] = [
                'type' => 'users',
                'count' => $demoUsers->count(),
                'description' => 'Users with example.com email addresses',
                'items' => $demoUsers
            ];
        }

        // Check for widgets with demo configurations
        $demoWidgets = Widget::where(function($query) {
            $query->where('name', 'like', '%demo%')
                  ->orWhere('name', 'like', '%test%')
                  ->orWhere('name', 'like', '%example%');
        })->get();
        
        if ($demoWidgets->count() > 0) {
            $cleanupActions[] = [
                'type' => 'widgets',
                'count' => $demoWidgets->count(),
                'description' => 'Widgets with demo/test names',
                'items' => $demoWidgets
            ];
        }

        // Check system settings for demo values
        $demoSettings = SystemSetting::where('value', 'like', '%demo%')
            ->orWhere('value', 'like', '%example.com%')
            ->orWhere('value', 'like', '%localhost%')
            ->get();
            
        if ($demoSettings->count() > 0) {
            $cleanupActions[] = [
                'type' => 'settings',
                'count' => $demoSettings->count(),
                'description' => 'System settings with demo values',
                'items' => $demoSettings
            ];
        }

        if (empty($cleanupActions)) {
            $this->info('✅ No demo data found!');
            return 0;
        }

        // Display what was found
        $this->warn('Found demo data:');
        foreach ($cleanupActions as $action) {
            $this->line("  - {$action['count']} {$action['description']}");
        }

        if ($dryRun) {
            $this->info('🔍 Dry run mode - showing details:');
            foreach ($cleanupActions as $action) {
                $this->line("\n{$action['description']}:");
                foreach ($action['items'] as $item) {
                    switch ($action['type']) {
                        case 'ai_providers':
                            $this->line("  - ID: {$item->id}, Type: {$item->provider_type}, Key: {$item->api_key}");
                            break;
                        case 'users':
                            $this->line("  - ID: {$item->id}, Name: {$item->name}, Email: {$item->email}");
                            break;
                        case 'widgets':
                            $this->line("  - ID: {$item->id}, Name: {$item->name}");
                            break;
                        case 'settings':
                            $this->line("  - Key: {$item->key}, Value: " . json_encode($item->value));
                            break;
                    }
                }
            }
            $this->info("\n🔍 Use --force to actually clean the data");
            return 0;
        }

        if (!$force && !$this->confirm('Do you want to clean up this demo data?')) {
            $this->info('Operation cancelled.');
            return 0;
        }

        // Perform cleanup
        $this->info('🧹 Cleaning up demo data...');

        foreach ($cleanupActions as $action) {
            switch ($action['type']) {
                case 'ai_providers':
                    $this->cleanAIProviders($action['items']);
                    break;
                case 'users':
                    $this->cleanUsers($action['items']);
                    break;
                case 'widgets':
                    $this->cleanWidgets($action['items']);
                    break;
                case 'settings':
                    $this->cleanSettings($action['items']);
                    break;
            }
        }

        $this->info('✅ Demo data cleanup completed!');
        return 0;
    }

    private function cleanAIProviders($providers)
    {
        foreach ($providers as $provider) {
            $this->line("Removing AI Provider: {$provider->provider_type} (ID: {$provider->id})");
            $provider->delete();
        }
    }

    private function cleanUsers($users)
    {
        foreach ($users as $user) {
            // Don't delete users that have real widgets or data
            $widgetCount = Widget::where('user_id', $user->id)->count();
            $messageCount = Message::whereHas('widget', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->count();

            if ($widgetCount > 0 || $messageCount > 0) {
                $this->warn("Skipping user {$user->email} - has {$widgetCount} widgets and {$messageCount} messages");
                continue;
            }

            $this->line("Removing demo user: {$user->email} (ID: {$user->id})");
            $user->delete();
        }
    }

    private function cleanWidgets($widgets)
    {
        foreach ($widgets as $widget) {
            // Check if widget has real conversations
            $messageCount = Message::where('widget_id', $widget->id)->count();
            
            if ($messageCount > 10) { // Keep widgets with significant usage
                $this->warn("Skipping widget '{$widget->name}' - has {$messageCount} messages");
                continue;
            }

            $this->line("Removing demo widget: {$widget->name} (ID: {$widget->id})");
            
            // Clean up related messages first
            Message::where('widget_id', $widget->id)->delete();
            $widget->delete();
        }
    }

    private function cleanSettings($settings)
    {
        foreach ($settings as $setting) {
            $this->line("Updating setting: {$setting->key}");
            
            // Update common demo values
            $value = $setting->value;
            if (is_string($value)) {
                $value = str_replace('@example.com', '@yourcompany.com', $value);
                $value = str_replace('localhost', 'yourserver.com', $value);
                $value = str_replace('demo-', 'your-', $value);
            }
            
            $setting->update(['value' => $value]);
        }
    }
}
