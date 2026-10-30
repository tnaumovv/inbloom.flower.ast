// Isolated test configuration. These are fake credentials, never used for live writes.
export const adminTestEnv = {
  NODE_ENV: 'development', SITE_URL: 'http://127.0.0.1:3104',
  ADMIN_GOOGLE_CLIENT_ID: 'admin-e2e.apps.googleusercontent.com', ADMIN_EMAILS: 'owner@gmail.com',
  ADMIN_SESSION_SECRET: 'isolated-admin-e2e-session-secret-32-characters',
  GOOGLE_SHEET_ID: 'isolated-admin-test-sheet', GOOGLE_SHEETS_API_KEY: 'fake-public-read-key-never-used',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.iam.gserviceaccount.com', GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'fake-key-never-used',
  CLOUDINARY_CLOUD_NAME: 'admin-e2e', CLOUDINARY_API_KEY: '123', CLOUDINARY_API_SECRET: 'fake-cloudinary-secret', CLOUDINARY_UPLOAD_PRESET: 'admin-e2e-signed',
};
