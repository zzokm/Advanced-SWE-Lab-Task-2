# Doctor Appointment Booking System

Advanced Software Engineering (2026 / 2027)  
Team Assignment / Software Engineering Workflow  
Teaching Assistant: Eng. Ahmed Ehab

## Team Information & Stage Assignment

| Student ID | Full Name | Assigned Task | Branch | PR Link |
|---|---|---|---|---|
| 20242447 | Yehia Hassan Abdelmoaty | Use Cases & Requirements | [`stage-1-use-cases`](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/tree/stage-1-use-cases) | [PR #1](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/pull/1) |
| 20240529 | Mohamed Motaz Maher | Class Diagram | [`Stage_2_Class_Diagram`](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/tree/Stage_2_Class_Diagram) | [PR #4](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/pull/4) |
| 20240529 | Mohamed Motaz Maher | Sequence Diagram | [`Stage_3_Sequence_Diagram`](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/tree/Stage_3_Sequence_Diagram) | [PR #5](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/pull/5) |
| 20242447 | Yehia Hassan Abdelmoaty | Implementation | [`Stage_4_Implementation`](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/tree/Stage_4_Implementation) | [PR #6](https://github.com/zzokm/Advanced-SWE-Lab-Task-2/pull/6) |
| N/A | N/A | Docker (team of 5 only) | N/A | N/A (Team of 2) |

---

## Live Demo & GitHub Pages

- **Live Application URL:** [https://zzokm.github.io/Advanced-SWE-Lab-Task-2/](https://zzokm.github.io/Advanced-SWE-Lab-Task-2/)
- **Automated Deployment:** Continuous deployment via GitHub Actions workflow (`.github/workflows/deploy.yml`) on merges to `main`.

---

## Application Run Instructions (Local)

The application is implemented as a lightweight, zero-dependency Vanilla HTML5/CSS3/JavaScript web application. It can be run locally using any of the following methods:

### Option 1: Direct File Launch (No server required)
Simply double-click [`index.html`](index.html) or open it with any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Python Built-in HTTP Server
From the root of the repository:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

### Option 3: Node / npx
```bash
npx serve .
```

---

## Engineering Lifecycle Deliverables

1. **Stage 1 (Use Cases & Requirements):**
   - Requirements specification with $N = 3$: [`requirements.txt`](requirements.txt)
   - Detailed use cases specification: [`use_cases.md`](use_cases.md)
   - Mermaid use case diagram: [`use_case_diagram.md`](use_case_diagram.md)
2. **Stage 2 (Class Diagram):**
   - Mermaid domain class diagram and traceability: [`Class_Diagram.md`](Class_Diagram.md)
3. **Stage 3 (Sequence Diagram):**
   - Mermaid interaction sequence diagrams (main & alternative flows): [`Sequence_Diagram.md`](Sequence_Diagram.md)
4. **Stage 4 (Implementation):**
   - Working responsive web application: [`index.html`](index.html), [`styles.css`](styles.css), [`app.js`](app.js)
   - Automated deployment pipeline: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

---

## Functional Requirements Implementation Scope ($N = 3$)

| ID | Requirement | Implementation Flow |
|---|---|---|
| **R1** | Patient can view doctor availability | `AvailabilityService.getAvailableSlots(doctorId)` queries active available slots sorted chronologically by day and time. |
| **R2** | Patient can book an available slot | `BookingService.bookAppointment(patientId, slotId)` atomically transitions slot from `Available` to `Pending` and creates an appointment record. |
| **R3** | Doctor can accept or decline request | `RequestService.acceptRequest()` locks slot to `Booked` with status `Accepted`. `RequestService.declineRequest()` sets status `Declined`, releases slot back to `Available`, and frees up patient quota. |
| **R4** | Maximum $N = 3$ upcoming appointments | `BookingPolicy.canBook()` counts future `Pending` + `Accepted` appointments. If count $\ge 3$, booking is strictly rejected with user alert and buttons disabled. `Declined`, `Cancelled`, and past appointments do not count toward this limit. |

---

## Non-Functional Requirements Fulfillment (R5–R7)

The assignment requires explaining in documentation how each non-functional requirement is addressed:

### R5: Patient Medical Data Accessible Only to Authorized Staff
- **Architectural Strategy:** Enforce Role-Based Access Control (RBAC). In the application architecture, `AccessControl` and `RequestService` partition patient data so doctors can only view appointment requests and patient contact records assigned to their own `doctorId`. Patients can only query and view their own appointments filtered by `patientId`.
- **Production Strategy:** In an enterprise production backend, authentication via OAuth2/JWT tokens with signed role claims (`ROLE_DOCTOR`, `ROLE_PATIENT`) ensures endpoint authorization. All data in transit is protected using TLS/HTTPS, and patient medical data at rest is encrypted using AES-256 with audit logging for all patient record access.

### R6: Available Appointment Times Displayed Within 2 Seconds
- **Architectural Strategy:** Pure client-side execution and indexing ensures availability is queried and rendered in `< 50ms`, well within the 2-second threshold.
- **Production Strategy:** In a backend service, doctor schedules are indexed in an in-memory Redis cache keyed by `doctor_id:date_range`. Database queries leverage composite B-Tree indexes on `(doctor_id, start_time, status)`, allowing sub-100ms response times even under heavy traffic.

### R7: Application Usable on Mobile Phone Screens
- **Architectural Strategy:** The web UI is designed mobile-first using responsive CSS Flexbox and Grid layouts. Touch targets (buttons, select dropdowns, and tabs) maintain a minimum clickable area of $\ge 44 \times 44\text{px}$ adhering to Apple and Material Design touch guidelines. Fluid typography and responsive media queries (`@media (max-width: 850px)`) ensure single-column vertical stacking and horizontal padding on small screens.
