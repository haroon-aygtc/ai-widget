<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'category',
        'is_public'
    ];

    protected $casts = [
        'value' => 'json',
        'is_public' => 'boolean'
    ];

    /**
     * Get a setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return $setting->value;
    }

    /**
     * Set a setting value.
     *
     * @param string $key
     * @param mixed $value
     * @param string $type
     * @param string|null $description
     * @param string $category
     * @param bool $isPublic
     * @return static
     */
    public static function set(
        string $key, 
        $value, 
        string $type = 'string', 
        ?string $description = null, 
        string $category = 'general',
        bool $isPublic = false
    ): static {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'description' => $description,
                'category' => $category,
                'is_public' => $isPublic
            ]
        );
    }

    /**
     * Get all settings by category.
     *
     * @param string $category
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getByCategory(string $category)
    {
        return static::where('category', $category)->get();
    }

    /**
     * Get public settings (safe to expose to frontend).
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getPublicSettings()
    {
        return static::where('is_public', true)->get();
    }

    /**
     * Get default widget configuration.
     *
     * @return array
     */
    public static function getDefaultWidgetConfig(): array
    {
        return [
            'design' => [
                'primaryColor' => static::get('widget.design.primary_color', '#3b82f6'),
                'secondaryColor' => static::get('widget.design.secondary_color', '#f3f4f6'),
                'textColor' => static::get('widget.design.text_color', '#111827'),
                'fontFamily' => static::get('widget.design.font_family', 'Inter'),
                'fontSize' => static::get('widget.design.font_size', 14),
                'borderRadius' => static::get('widget.design.border_radius', 8),
                'headerText' => static::get('widget.design.header_text', 'Chat with AI Assistant'),
                'buttonText' => static::get('widget.design.button_text', 'Send'),
                'placeholderText' => static::get('widget.design.placeholder_text', 'Type your message here...'),
            ],
            'behavior' => [
                'welcomeMessage' => static::get('widget.behavior.welcome_message', 'Welcome to our AI chat assistant. How can I help you today?'),
                'initialMessage' => static::get('widget.behavior.initial_message', 'Hello! How can I help you today?'),
                'typingIndicator' => static::get('widget.behavior.typing_indicator', true),
                'showTimestamp' => static::get('widget.behavior.show_timestamp', true),
                'autoResponse' => static::get('widget.behavior.auto_response', true),
                'responseDelay' => static::get('widget.behavior.response_delay', 500),
                'maxMessages' => static::get('widget.behavior.max_messages', 50),
            ],
            'placement' => [
                'position' => static::get('widget.placement.position', 'bottom-right'),
                'offsetX' => static::get('widget.placement.offset_x', 20),
                'offsetY' => static::get('widget.placement.offset_y', 20),
                'mobilePosition' => static::get('widget.placement.mobile_position', 'bottom'),
                'showOnPages' => static::get('widget.placement.show_on_pages', 'all'),
                'excludePages' => static::get('widget.placement.exclude_pages', ''),
                'triggerType' => static::get('widget.placement.trigger_type', 'button'),
                'triggerText' => static::get('widget.placement.trigger_text', 'Chat with us'),
            ]
        ];
    }

    /**
     * Initialize default system settings.
     *
     * @return void
     */
    public static function initializeDefaults(): void
    {
        $defaults = [
            // General Settings
            ['key' => 'site.name', 'value' => 'AI Chat Widget Platform', 'type' => 'string', 'category' => 'general', 'description' => 'Site name', 'is_public' => true],
            ['key' => 'site.description', 'value' => 'Build and deploy AI-powered chat widgets', 'type' => 'string', 'category' => 'general', 'description' => 'Site description', 'is_public' => true],
            ['key' => 'site.contact_email', 'value' => 'support@example.com', 'type' => 'string', 'category' => 'general', 'description' => 'Contact email'],
            ['key' => 'site.timezone', 'value' => 'UTC', 'type' => 'string', 'category' => 'general', 'description' => 'Default timezone'],
            ['key' => 'site.language', 'value' => 'en', 'type' => 'string', 'category' => 'general', 'description' => 'Default language'],
            ['key' => 'site.maintenance_mode', 'value' => false, 'type' => 'boolean', 'category' => 'general', 'description' => 'Maintenance mode'],

            // Widget Default Design
            ['key' => 'widget.design.primary_color', 'value' => '#3b82f6', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default primary color'],
            ['key' => 'widget.design.secondary_color', 'value' => '#f3f4f6', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default secondary color'],
            ['key' => 'widget.design.text_color', 'value' => '#111827', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default text color'],
            ['key' => 'widget.design.font_family', 'value' => 'Inter', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default font family'],
            ['key' => 'widget.design.font_size', 'value' => 14, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Default font size'],
            ['key' => 'widget.design.border_radius', 'value' => 8, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Default border radius'],
            ['key' => 'widget.design.header_text', 'value' => 'Chat with AI Assistant', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default header text'],
            ['key' => 'widget.design.button_text', 'value' => 'Send', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default button text'],
            ['key' => 'widget.design.placeholder_text', 'value' => 'Type your message here...', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default placeholder text'],

            // Widget Default Behavior
            ['key' => 'widget.behavior.welcome_message', 'value' => 'Welcome to our AI chat assistant. How can I help you today?', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default welcome message'],
            ['key' => 'widget.behavior.initial_message', 'value' => 'Hello! How can I help you today?', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default initial message'],
            ['key' => 'widget.behavior.typing_indicator', 'value' => true, 'type' => 'boolean', 'category' => 'widget_defaults', 'description' => 'Show typing indicator'],
            ['key' => 'widget.behavior.show_timestamp', 'value' => true, 'type' => 'boolean', 'category' => 'widget_defaults', 'description' => 'Show message timestamps'],
            ['key' => 'widget.behavior.auto_response', 'value' => true, 'type' => 'boolean', 'category' => 'widget_defaults', 'description' => 'Enable auto responses'],
            ['key' => 'widget.behavior.response_delay', 'value' => 500, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Response delay in milliseconds'],
            ['key' => 'widget.behavior.max_messages', 'value' => 50, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Maximum messages per conversation'],

            // Widget Default Placement
            ['key' => 'widget.placement.position', 'value' => 'bottom-right', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default widget position'],
            ['key' => 'widget.placement.offset_x', 'value' => 20, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Default X offset'],
            ['key' => 'widget.placement.offset_y', 'value' => 20, 'type' => 'integer', 'category' => 'widget_defaults', 'description' => 'Default Y offset'],
            ['key' => 'widget.placement.mobile_position', 'value' => 'bottom', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default mobile position'],
            ['key' => 'widget.placement.show_on_pages', 'value' => 'all', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default page visibility'],
            ['key' => 'widget.placement.exclude_pages', 'value' => '', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default excluded pages'],
            ['key' => 'widget.placement.trigger_type', 'value' => 'button', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default trigger type'],
            ['key' => 'widget.placement.trigger_text', 'value' => 'Chat with us', 'type' => 'string', 'category' => 'widget_defaults', 'description' => 'Default trigger text'],

            // Security Settings
            ['key' => 'security.two_factor_auth', 'value' => false, 'type' => 'boolean', 'category' => 'security', 'description' => 'Enable 2FA by default'],
            ['key' => 'security.session_timeout', 'value' => 24, 'type' => 'integer', 'category' => 'security', 'description' => 'Session timeout in hours'],
            ['key' => 'security.password_expiry', 'value' => 90, 'type' => 'integer', 'category' => 'security', 'description' => 'Password expiry in days'],
            ['key' => 'security.login_attempts', 'value' => 5, 'type' => 'integer', 'category' => 'security', 'description' => 'Max login attempts'],
            ['key' => 'security.ip_whitelist', 'value' => '', 'type' => 'string', 'category' => 'security', 'description' => 'IP whitelist'],

            // Notification Settings
            ['key' => 'notifications.email_notifications', 'value' => true, 'type' => 'boolean', 'category' => 'notifications', 'description' => 'Enable email notifications'],
            ['key' => 'notifications.push_notifications', 'value' => true, 'type' => 'boolean', 'category' => 'notifications', 'description' => 'Enable push notifications'],
            ['key' => 'notifications.weekly_reports', 'value' => true, 'type' => 'boolean', 'category' => 'notifications', 'description' => 'Send weekly reports'],
            ['key' => 'notifications.security_alerts', 'value' => true, 'type' => 'boolean', 'category' => 'notifications', 'description' => 'Send security alerts'],
            ['key' => 'notifications.marketing_emails', 'value' => false, 'type' => 'boolean', 'category' => 'notifications', 'description' => 'Send marketing emails'],
        ];

        foreach ($defaults as $setting) {
            static::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
