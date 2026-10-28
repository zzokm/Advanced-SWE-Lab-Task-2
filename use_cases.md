# Use Cases Specification

## System Overview
The **Doctor Appointment Booking System** is a healthcare coordination platform that enables patients to browse doctor schedules and request appointments, while empowering doctors to manage their schedule and accept or decline requests.

### System Configuration
- **Max Upcoming Appointments Limit ($N$):** $N = 3$.
- **Upcoming Statuses Counted Towards $N$:** `Pending`, `Accepted` (where appointment date/time is in the future).
- **Statuses Excluded from $N$:** `Declined`, `Cancelled`, and all past appointments.

---

## Actors

1. **Patient**: A registered or identified user seeking medical consultation who browses doctor schedules and books appointments.
2. **Doctor**: A medical professional who publishes available consultation slots and reviews booking requests.

---

## Use Case Descriptions

### UC-1: View Doctor Availability
- **ID:** UC-1
- **Traceability:** Requirement **R1**
- **Primary Actor:** Patient
- **Preconditions:** The doctor exists in the system and has published availability.
- **Trigger:** The patient selects a doctor or navigates to the schedule page.
- **Main Success Scenario:**
  1. Patient selects a doctor from the doctor directory.
  2. Patient requests the available days and times.
  3. System retrieves all available, unbooked time slots for the chosen doctor.
  4. System displays the available slots sorted chronologically (day and time).
- **Alternative Flow:**
  - *3a. Doctor has no open slots:* System informs the patient: "No upcoming available slots for this doctor."

---

### UC-2: Book Appointment
- **ID:** UC-2
- **Traceability:** Requirements **R2, R4**
- **Primary Actor:** Patient
- **Preconditions:** Patient is identified by `patient_id`; target slot is marked available.
- **Trigger:** Patient clicks "Book Appointment" on an available time slot.
- **Main Success Scenario:**
  1. Patient chooses an available time slot for a specific doctor.
  2. System counts the patient's current upcoming appointments (future `Pending` + `Accepted`).
  3. System verifies that the count is strictly less than $N$ ($N = 3$).
  4. System creates a new appointment record with status `Pending`.
  5. System marks the chosen time slot as reserved/pending.
  6. System confirms the booking request to the patient.
- **Alternative Flows:**
  - *3a. Upcoming Limit Exceeded ($count \ge 3$):*
    - System rejects the booking request.
    - System displays an error message: *"Booking rejected: You have reached the maximum allowed upcoming appointments (N = 3)."*
    - The slot remains available.
  - *4a. Slot Already Taken (Race Condition):*
    - System detects the slot was just booked by another patient.
    - System displays: *"This slot has already been booked. Please choose another."*

---

### UC-3: View Patient Appointments
- **ID:** UC-3
- **Traceability:** Requirement **R4**
- **Primary Actor:** Patient
- **Preconditions:** Patient is identified in the system.
- **Trigger:** Patient visits their "My Appointments" dashboard.
- **Main Success Scenario:**
  1. Patient requests their appointments list.
  2. System retrieves all appointments associated with `patient_id`.
  3. System categorizes and displays:
     - **Upcoming active appointments:** Status `Pending` or `Accepted` scheduled in the future (displayed alongside current quota: e.g., $1 / 3$ used).
     - **Inactive / historical appointments:** Status `Declined`, `Cancelled`, or past dates.

---

### UC-4: View Appointment Requests
- **ID:** UC-4
- **Traceability:** Requirement **R3**
- **Primary Actor:** Doctor
- **Preconditions:** Doctor is logged in or identified by `doctor_id`.
- **Trigger:** Doctor visits their appointment dashboard.
- **Main Success Scenario:**
  1. Doctor requests incoming appointment requests.
  2. System retrieves all appointments associated with this doctor.
  3. System displays pending requests with patient name, requested date/time slot, and contact details.

---

### UC-5: Accept Appointment Request
- **ID:** UC-5
- **Traceability:** Requirement **R3**
- **Primary Actor:** Doctor
- **Preconditions:** Appointment request exists with status `Pending`.
- **Trigger:** Doctor clicks "Accept" on a pending appointment.
- **Main Success Scenario:**
  1. Doctor selects a pending appointment request and clicks "Accept".
  2. System validates the appointment status is `Pending`.
  3. System updates the appointment status to `Accepted`.
  4. System locks the time slot permanently for this appointment.
  5. System notifies or displays updated confirmation status.

---

### UC-6: Decline Appointment Request
- **ID:** UC-6
- **Traceability:** Requirements **R3, R4**
- **Primary Actor:** Doctor
- **Preconditions:** Appointment request exists with status `Pending`.
- **Trigger:** Doctor clicks "Decline" on a pending appointment.
- **Main Success Scenario:**
  1. Doctor selects a pending appointment request and clicks "Decline".
  2. System updates the appointment status to `Declined`.
  3. System frees up the corresponding doctor time slot so other patients may book it.
  4. The declined appointment no longer counts toward the patient's upcoming quota ($N = 3$).

---

## Non-Functional Requirements Strategy

| ID | Requirement | Architectural / Design Strategy |
|---|---|---|
| **R5** | *Patient medical data accessible only to authorized staff* | Implement Role-Based Access Control (RBAC). Patient records are partitioned; endpoints verify caller credentials (`Patient` can view only their own records, `Doctor` can view only their assigned patients). Data at rest and in transit encrypted via HTTPS / TLS. |
| **R6** | *Available appointment times displayed within 2 seconds* | Slices of available schedules are indexed by `doctor_id` and date range. Lightweight JSON API endpoints with caching of doctor static availability ensure sub-100ms response times. |
| **R7** | *Application usable on mobile phone screens* | Responsive frontend UI designed using fluid CSS Grid / Flexbox layouts, viewport meta tags, touch-friendly tap targets ($\ge 44 \times 44$ px), and responsive breakpoints (mobile $< 768$ px). |
