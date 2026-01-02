import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Custom tasks for database operations
      on('task', {
        // Task to seed database with test data
        'db:seed': async () => {
          // TODO: Implement database seeding
          console.log('Seeding database...');
          return null;
        },
        
        // Task to clear database
        'db:clear': async () => {
          // TODO: Implement database clearing
          console.log('Clearing database...');
          return null;
        },
        
        // Task to create test user
        'db:createUser': async (userData: any) => {
          // TODO: Implement user creation
          console.log('Creating user:', userData);
          return userData;
        },
        
        // Log to terminal
        log(message: string) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html',
  },
  env: {
    // Environment variables for testing
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
});
