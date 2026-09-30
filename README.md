# S2DCMS Frontend

React frontend for the Student to Department Complaint Management System.

## Related Repositories

- **Backend**: [s2dcms-backend](https://github.com/emmanuel-40/s2dcms-backend) - Spring Boot backend with cookie-based JWT authentication, Redis caching, and RabbitMQ email processing
- **API reference**: [API_DOCUMENTATION.md](https://github.com/emmanuel-40/s2dcms-backend/blob/main/API_DOCUMENTATION.md) - request/response contract for every endpoint

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file in this repository for details.

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

This frontend implements enterprise-grade security patterns aligned with the Spring Boot backend:

### Cookie-Based Authentication
- **HttpOnly Cookies**: Access and refresh tokens stored in HttpOnly cookies (JavaScript cannot access tokens)
- **CSRF Protection**: Automatic X-XSRF-TOKEN header inclusion for state-changing requests
- **No LocalStorage**: Tokens never stored in localStorage (prevents XSS token theft)
- **Automatic Cookie Management**: Browser handles cookie lifecycle automatically
- **Environment-Aware**: Cookie settings adapt to development vs production environments

### Authentication Flow
1. User logs in → backend sets HttpOnly cookies (`accessToken`, `refreshToken`) via `Set-Cookie`; the JSON body returns only `email` and `role`
2. Every request is sent with `credentials: 'include'` so the browser attaches the cookies automatically
3. `apiClient` reads the readable `XSRF-TOKEN` cookie and adds `X-XSRF-TOKEN` to `POST`/`PUT`/`PATCH`/`DELETE`
4. Access token expires → the request gets a `401`, `apiClient` calls the refresh endpoint (cookies are re-set by the backend), re-seeds the CSRF cookie via `/auth/me`, and replays the original request
5. Concurrent `401`s do not stampede: a `isRefreshing` flag lets one request refresh while the rest wait on a promise queue and replay afterwards
6. If the refresh itself fails, the queue is rejected, local state is cleared, and the user is redirected to `/login`
7. On logout → backend revokes the refresh token and clears both cookies

### Role-Based Access
- **STUDENT**: Can access student portal (`/student/*`)
- **DEPARTMENT**: Can access department portal (`/department/*`)
- Protected routes enforce role-based access control

### Rate Limiting
- Handles rate limit responses from backend
- Shows user-friendly cooldown messages with remaining time

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Spring Boot backend running on `http://localhost:8080`

## Installation

1. Navigate to the frontend directory:
```bash
cd s2dcms-frontend
```

2. Install dependencies:
```bash
npm install
```

This will install React, Tailwind CSS, and all other dependencies.

## Configuration

All API URLs come from one place — `src/config.js`:

```js
const BACKEND_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';
```

- **Frontend URL**: `http://localhost:5173`
- **Backend URL**: `http://localhost:8080`
- **API Proxy**: `/api` → `http://localhost:8080`, configured in `vite.config.js` (it also forwards `Cookie` and `X-XSRF-TOKEN` so cookies work on localhost)
- **Tailwind CSS**: Configured in `tailwind.config.js` with custom blue color palette

Leave `VITE_API_BASE_URL` unset for local development — the proxy keeps requests
same-origin, which is what makes the `HttpOnly` session cookies work without CORS
 gymnastics. Copy `.env.example` to `.env.local` if you need an override; `.env*`
files are git-ignored. No configuration is needed if the backend runs on port 8080.

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
- Cookie-based authentication (HttpOnly cookies)
- CSRF protection (X-XSRF-TOKEN headers)
- No localStorage token storage (XSS protection)
- Automatic token refresh
- Role-based access control
- Protected routes
- Secure file upload handling

## File Upload Support

- **Max file size**: 5MB
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
- The frontend holds no secrets — the JWT secret lives only on the backend, so check backend configuration there
- Confirm the request is sent with `credentials: 'include'` and that the backend CORS allowlist contains the exact origin in use (`*` cannot be combined with credentials)
- Confirm an `X-XSRF-TOKEN` header arrives on API responses (DevTools → Network). The client captures it automatically and bootstraps through `GET /api/auth/csrf` before the first state-changing request; a `403` with `CSRF token missing or invalid` triggers one automatic re-seed + retry
- Verify token lifetimes (15 min access, 24 h refresh) and that PostgreSQL is reachable for refresh-token storage
- Cross-origin deployments need `ENVIRONMENT=production` on the backend so cookies are sent with `SameSite=None; Secure`

### File Upload Issues
- Verify file size limits (max 5MB)
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

1. **HttpOnly Cookie Storage**: tokens arrive via `Set-Cookie` and are unreadable to application JavaScript
2. **Zero Token Surface**: no token is read from, written to, or logged from `localStorage`/`sessionStorage`; the login response body has no token fields
3. **CSRF Protection**: `XSRF-TOKEN` cookie mirrored into the `X-XSRF-TOKEN` header on every unsafe method
4. **Single-Flight Token Refresh**: one in-flight refresh, concurrent `401`s queued on a promise and replayed after the new cookies land
5. **Credential Handling**: `credentials: 'include'` on every call, `skipAuthRefresh` guard so the refresh call can never loop
6. **Role-Based Access**: enforced at route level by `ProtectedRoute` (`STUDENT` / `DEPARTMENT`)
7. **Secure File Upload**: client-side size limit (5 MB) and type validation ahead of the backend check
8. **Graceful Degradation**: refresh failure clears state and redirects to `/login` instead of leaving a half-authenticated UI
9. **User-Friendly Rate Limiting**: backend cooldown minutes surfaced verbatim to the user

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

# Deployment

This frontend is deployed using free-tier hosting services:

## Production Hosting Stack
- **Frontend Hosting**: Vercel (free tier) - https://student-complaints-tau.vercel.app
- **Backend Hosting**: Render (free web service) - https://s2dcms-backend.onrender.com
- **Database**: Supabase PostgreSQL (permanent free tier)
- **Cache**: Redis Cloud (free tier)
- **Message Queue**: CloudAMQP RabbitMQ (free tier)
- **Uptime Monitoring**: UptimeRobot (free tier)

## Environment Variables for Production

The following environment variables should be set on Vercel:

```bash
# Backend API URL
VITE_API_BASE_URL=https://s2dcms-backend.onrender.com
```

## Deployment Steps

1. **Set up backend hosting** (Render with Supabase, Redis Cloud, CloudAMQP)
2. **Push frontend code to GitHub**
3. **Connect repository to Vercel**
4. **Configure the environment variable** `VITE_API_BASE_URL`
5. **Deploy and test**
6. **Verify frontend connects to backend** — the deployed origin must be present in the backend CORS allowlist, or every credentialed request will be blocked

## Local vs Production Configuration

| | Local | Production |
| --- | --- | --- |
| API base | `VITE_API_BASE_URL` unset → `/api`, proxied to `http://localhost:8080` by `vite.config.js` | `VITE_API_BASE_URL=https://s2dcms-backend.onrender.com` → calls go to `.../api` on the deployed API |
| Cookies | same-origin through the proxy, `SameSite=Lax` | cross-site, so the backend must run with `ENVIRONMENT=production` to send `SameSite=None; Secure` |
| CORS | not exercised (proxied) | backend allowlist must contain the exact Vercel origin |

`VITE_API_BASE_URL` is the only variable the app reads (`src/config.js`). Vercel
exposes it at build time, so redeploy after changing it.

## License

MIT License — see the [LICENSE](LICENSE) file in this repository for details.

## Author

Developed by **Eze Emmanuel** · [github.com/emmanuel-40](https://github.com/emmanuel-40)

This frontend is the client half of the S2DCMS project; the API lives in
[s2dcms-backend](https://github.com/emmanuel-40/s2dcms-backend).
