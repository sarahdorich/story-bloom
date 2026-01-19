# Context for Claude

## Architecture Notes

The correct production url for StoryBloom's web application is: https://story-bloom.shredstack.net.

Native iOS app will eventually use Capacitor WebView loading from story-bloom.shredstack.net, so web changes automatically appear in the app without rebuild/resubmission.

## App Development Best Practices

### Reusable Components
When adding features that appear in multiple places (e.g., onboarding AND settings), create a shared component in `components/` rather than duplicating code. Use the controlled component pattern where the parent manages state and passes `value`/`onChange` props.

Before writing new UI code, check if similar functionality already exists that could be extracted into a reusable component

### Important coding guidelines

1. Separation of concerns - Each module handles one thing (for example, in meal generation, each module should handle one stage of meal generation)
2. Testability - Modules should be written so that we can test individual stages/components in isolation
3. Maintainability - We want code that's easier to iterate on without risking other stages or components
4. Readability - Clear code organization for future development


## Database migrations

All database migrations live in supabase/migrations. New migrations should be generated using the following supabase command.
```bash
supabase migration new <description>
```
This will create a file in the migrations directory which can then be filled out with the SQL for the migration.

Then to apply the new migrations locally, you can use this:
```bash
supabase migration up
```

Never push migrations to production! So don't use the `--linked` flag! For example, never run the following:
```bash
supabase db push --linked
```

