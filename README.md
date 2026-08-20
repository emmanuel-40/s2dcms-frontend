# S2DCMS Frontend

React frontend for the Student to Department Complaint Management System.

## Related Repositories

- **Backend**: [s2dcms-backend](https://github.com/emmanuel-40/s2dcms-backend) - Spring Boot backend with JWT authentication, Redis caching, and RabbitMQ email processing

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Design System

The frontend uses a **blue, white, and gray color scheme** with Tailwind CSS:

- **Primary Blue**: `#3b82f6` (blue-600)
- **Background Gray**: `#f3f4f6` (gray-100)
- **White Cards**: `#ffffff`
- **Status Colors**:
  - Pending: Yellow (`#eab308`)
  - In Progress: Cyan (`#06b6d4`)
  - Replied: Green (`#22c55e`)
  - Closed: Gray (`#6b7280`)
  - Error: Red (`#dc2626`)

## Security Implementation

This frontend implements advanced security patterns aligned with the Spring Boot backend:

### JWT Token Management
- **Access Tokens**: Stored in memory only (never in localStorage for security)
- **Refresh Tokens**: Stored in localStorage with automatic rotation
- **Token Rotation**: Old refresh tokens are revoked when new ones are issued
- **Auto-refresh**: Automatic token refresh when access tokens expire
- **Session Management**: Supports up to 4 active sessions per user with automatic cleanup

### Authentication Flow
1. User logs in → receives access + refresh tokens
2. Access token used for API calls (15 min expiry)
3. When access token expires → automatic refresh using refresh token
4. Refresh token rotates on each use (old token becomes invalid)
5. On logout → refresh token revoked on backend

### Role-Based Access
- **STUDENT**: Can access student portal (`/student/*`)
- **DEPARTMENT**: Can access department portal (`/department/*`)
- Protected routes enforce role-based access control

### Rate Limiting
- Handles 429 responses from backend rate limiting
- Shows user-friendly cooldown messages

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Spring Boot backend running on `http://localhost:8080`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

This will install React, Tailwind CSS, and all other dependencies.

## Configuration

The frontend is configured to proxy API requests to the backend:

- **Frontend URL**: `http://localhost:5173`
- **Backend URL**: `http://localhost:8080`
- **API Proxy**: Configured in `vite.config.js`
- **Tailwind CSS**: Configured in `tailwind.config.js` with custom blue color palette

No additional configuration needed if backend runs on default port.

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## Project Structure

**Key Directories:**
- `src/components/` - Reusable components (ProtectedRoute, ProfileModal, AttachmentModal)
- `src/context/` - React Context for authentication state management
- `src/pages/` - Page components for student and department portals
- `src/services/` - API service layer with automatic token refresh
- `src/utils/` - Utility functions and helpers

## Available Pages

### Public Pages
- `/login` - Login page for students and departments
- `/register` - Student registration

### Student Portal (Protected)
- `/student/dashboard` - Student dashboard with profile and complaints
- `/student/complaints` - List of all student complaints
- `/student/complaints/new` - Submit new complaint
- `/student/complaints/:id` - View complaint details

### Department Portal (Protected)
- `/department/dashboard` - Department dashboard with statistics
- `/department/complaints` - List of assigned complaints
- `/department/complaints/:id` - View complaint details
- `/department/complaints/:id/reply` - Reply to complaint

## Features

### Student Features
- Registration with email verification
- Profile management with image upload
- Submit complaints with file attachments
- View complaint history with status tracking
- Filter complaints by status
- Sort complaints by date
- **AI-Powered Features**:
  - Complaint Writing Assistant: Help write formal complaints with AI-generated title and content

### Department Features
- Dashboard with complaint statistics
- View assigned complaints
- Reply to complaints with file attachments
- Close complaints
- Filter complaints by status
- Sort complaints by date
- **AI-Powered Features**:
  - Complaint Summarization: Auto-generate bullet point summaries
  - Reply Suggestions: Get AI-suggested professional responses with copy button

### Security Features
- JWT-based authentication
- Automatic token refresh
- Token rotation
- Role-based access control
- Protected routes
- Secure file upload handling

## File Upload Support

- **Max file size**: 20MB
- **Supported formats**: PDF, JPG, PNG, DOC, DOCX
- **Implementation**: FormData for multipart uploads

## Backend Integration

The frontend integrates with the following backend endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/user/change-password` - Change password

### Student Endpoints
- `POST /api/students/auth/register` - Student registration
- `GET /api/students/auth/verify` - Email verification
- `POST /api/students/auth/resend-verification` - Resend verification
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `POST /api/students/complaints` - Submit complaint
- `GET /api/students/complaints` - Get complaints
- `GET /api/students/complaints/:id` - Get complaint details

### Department Endpoints
- `GET /api/department/profile` - Get department profile
- `PUT /api/department/profile` - Update department profile
- `GET /api/department/complaints` - Get complaints
- `GET /api/department/complaints/:id` - Get complaint details
- `POST /api/department/reply` - Reply to complaint
- `PUT /api/department/complaints/:id/close` - Close complaint

## Troubleshooting

### Backend Connection Issues
- Ensure Spring Boot backend is running on port 8080
- Check that CORS is configured in backend
- Verify API proxy configuration in `vite.config.js`

### Authentication Issues
- Check that JWT secret matches backend configuration
- Verify token expiration times (15 min access, 24 hour refresh)
- Ensure PostgreSQL is available for refresh token storage

### File Upload Issues
- Verify file size limits (max 20MB)
- Check backend file storage directory permissions
- Ensure multipart configuration in backend

### Tailwind CSS Issues
- If Tailwind classes don't work, run `npm install` to ensure all dependencies are installed
- Check that `tailwind.config.js` and `postcss.config.js` are present in the root
- Verify that `index.css` contains the Tailwind directives

## Development Notes

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `App.jsx`
3. Wrap with appropriate protected route component if needed
4. Use Tailwind CSS classes for styling

### Adding New API Calls
1. Add method to appropriate service file (`studentService.js` or `departmentService.js`)
2. Use `apiClient` for automatic token refresh
3. Handle errors appropriately

### Styling with Tailwind CSS
- All styling uses Tailwind utility classes
- Custom colors defined in `tailwind.config.js`
- Responsive design using Tailwind breakpoints (`md:`, `lg:`, etc.)
- Hover states using `hover:` prefix
- Focus states using `focus:` prefix

### Common Tailwind Classes Used
- **Layout**: `flex`, `grid`, `gap-4`, `p-4`, `m-4`
- **Colors**: `bg-blue-600`, `text-gray-800`, `bg-white`, `bg-gray-100`
- **Typography**: `text-xl`, `font-bold`, `text-sm`
- **Borders**: `border`, `rounded-lg`, `shadow-md`
- **Interactivity**: `hover:bg-blue-700`, `transition-colors`

## Security Best Practices Implemented

1. **Access Token Storage**: In-memory only (not persisted)
2. **Refresh Token Rotation**: Old tokens invalidated on refresh
3. **Automatic Token Refresh**: Transparent to user
4. **Role-Based Access**: Enforced at route level
5. **Secure File Upload**: Size limits and type validation
6. **Error Handling**: Graceful degradation on auth failures

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This frontend is part of the S2DCMS project.
