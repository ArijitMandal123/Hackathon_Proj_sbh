# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## User Account Management

### Account Deletion and Team Management

The application includes a robust system for handling user account deletions, ensuring that team data remains consistent:

#### Features

1. **User Account Deletion**

   - Users can delete their accounts from the Settings page
   - Account deletion requires password confirmation for security
   - All user profile data is completely removed from the database

2. **Team Cleanup on User Deletion**

   - When a user deletes their account, they are automatically removed from all teams
   - If the deleted user was a team leader, another team member is automatically promoted to leader
   - Teams display "Account Deleted" indicators for members who have deleted their accounts

3. **Team Vacancy Management**

   - When users are removed from teams (either by leaving or account deletion), vacancies are created
   - Teams with vacancies are visually indicated with a badge
   - Users can filter to show only teams with available vacancies

4. **Firebase Cloud Function**
   - A Cloud Function ensures that even if users are deleted directly from Firebase Auth (e.g., through the Firebase Console),
     all related cleanup still happens automatically

#### Implementation

The account deletion and cleanup system is implemented across several components:

- `src/utils/userCleanup.js` - Contains utility functions for cleaning up user data
- `src/contexts/AuthContext.jsx` - Provides the `deleteAccount` function for account deletion
- `src/components/auth/DeleteAccountForm.jsx` - UI for account deletion with password confirmation
- `src/pages/ProfileSettingsPage.jsx` - Page that includes the account deletion form
- `src/components/team/TeamList.jsx` - Shows team vacancies and includes a filter for teams with vacancies
- `src/pages/TeamDetailPage.jsx` - Handles display of team members including deleted accounts
- `functions/index.js` - Cloud function for automatic cleanup when accounts are deleted

#### Security Considerations

- Account deletion requires password confirmation to prevent unauthorized deletion
- The system handles edge cases like team leaders being deleted
- Hierarchical deletion ensures that no orphaned data remains in the database
