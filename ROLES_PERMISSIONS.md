# ScholarlySync Role-Based Access Control (RBAC)

This document outlines the permissions and access rules for different user roles within the ScholarlySync platform.

## User Roles

| Role | Description |
| :--- | :--- |
| **STUDENT** | Primary consumer of content. Can submit assignments and view materials. |
| **TEACHER** | Content creator. Can manage courses, assignments, and review student work. |
| **ADMIN** | System overseer. Full access to user management and system monitoring. |

---

## Entity Permissions

### Courses
| Action | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| View List | ✅ | ✅ | ✅ |
| View Details | ✅ | ✅ | ✅ |
| Create Course | ❌ | ✅ | ✅ |
| Update Course | ❌ | ✅ | ✅ |
| Delete Course | ❌ | ✅ | ✅ |

### Assignments
| Action | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| View List / Upcoming | ✅ | ✅ | ✅ |
| View Details | ✅ | ✅ | ✅ |
| Create Assignment | ❌ | ✅ | ✅ |
| Update Assignment | ❌ | ✅ | ✅ |
| Delete Assignment | ❌ | ✅ | ✅ |
| **Submit Assignment** | ✅ | ❌ | ❌ |

### Submissions
| Action | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| View Own Submissions | ✅ | ✅ | ✅ |
| View Assignment Submissions | ❌ | ✅ | ✅ |
| View Submission Details | ✅* | ✅ | ✅ |
| Delete Submission | ❌ | ❌ | ✅ |
| *Note: Students can only view their own submissions.* | | | |

### Course Materials
| Action | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| View Materials | ✅ | ✅ | ✅ |
| Upload Material | ❌ | ✅ | ✅ |
| Update Material | ❌ | ✅ | ✅ |
| Delete Material | ❌ | ✅ | ✅ |

### User & System Management
| Action | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| View User List | ❌ | ❌ | ✅ |
| Toggle Premium Status | ❌ | ❌ | ✅ |
| View System Stats (Queues) | ❌ | ✅ | ✅ |
| Bulk Broadcast (Notifications) | ❌ | ✅ | ✅ |

---

## Premium Features

The `is_premium` flag on a `User` enables additional capabilities:

- **AI Study Room**: Enhanced access to real-time AI assistance (higher rate limits/streaming).
- **Unlimited AI Feedback**: No daily caps on AI-driven assignment analysis.
- **Priority Processing**: Submissions from premium users are prioritized in the background workers.

---

## Security Implementation

- **Authentication**: Handled via `httpOnly` cookies (`accessToken`).
- **Authorization**: Enforced by the `requireRole(...roles)` middleware in the backend.
- **Data Isolation**: Database queries (e.g., `submissions.findMany`) are scoped to the `userId` for students to prevent cross-account data access.
