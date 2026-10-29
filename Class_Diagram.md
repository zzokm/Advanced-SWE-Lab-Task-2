# Class Diagram: Doctor Appointment Booking System

Configuration: **N = 3** (max upcoming appointments per patient).
Upcoming = future `Pending` + `Accepted`. `Declined`, `Cancelled` and past appointments do not count.

```mermaid
classDiagram
    direction LR

    class User {
        <<abstract>>
        -int id
        -String name
        -String email
        -String phone
        +getContactDetails() String
    }

    class Patient {
        -int patientId
        +getUpcomingAppointments() List~Appointment~
        +getHistoricalAppointments() List~Appointment~
        +getUpcomingCount() int
    }

    class Doctor {
        -int doctorId
        -String specialty
        +publishSlot(start, end) TimeSlot
        +getAvailableSlots() List~TimeSlot~
        +getPendingRequests() List~Appointment~
    }

    class TimeSlot {
        -int slotId
        -int doctorId
        -DateTime startTime
        -DateTime endTime
        -SlotStatus status
        +isAvailable() boolean
        +reserve() void
        +lock() void
        +release() void
    }

    class Appointment {
        -int appointmentId
        -int patientId
        -int doctorId
        -int slotId
        -AppointmentStatus status
        -DateTime createdAt
        +isUpcoming() boolean
        +countsTowardLimit() boolean
        +accept() void
        +decline() void
        +cancel() void
    }

    class AppointmentStatus {
        <<enumeration>>
        Pending
        Accepted
        Declined
        Cancelled
    }

    class SlotStatus {
        <<enumeration>>
        Available
        Pending
        Booked
    }

    class AvailabilityService {
        -SlotRepository slotRepo
        -Cache availabilityCache
        +getAvailableSlots(doctorId) List~TimeSlot~
    }

    class BookingService {
        -BookingPolicy policy
        -AppointmentRepository apptRepo
        -SlotRepository slotRepo
        +bookAppointment(patientId, slotId) Appointment
        +getPatientAppointments(patientId) List~Appointment~
    }

    class BookingPolicy {
        -int maxUpcoming = 3
        +canBook(patient) boolean
        +getMaxUpcoming() int
    }

    class RequestService {
        -AppointmentRepository apptRepo
        -AccessControl accessControl
        +getRequests(doctorId) List~Appointment~
        +acceptRequest(doctorId, appointmentId) void
        +declineRequest(doctorId, appointmentId) void
    }

    class AccessControl {
        <<R5 RBAC>>
        +canViewPatientRecord(user, patientId) boolean
        +canManageAppointment(doctor, appointment) boolean
    }

    class AppointmentRepository {
        <<interface>>
        +findByPatient(patientId) List~Appointment~
        +findByDoctor(doctorId) List~Appointment~
        +save(appointment) void
    }

    class SlotRepository {
        <<interface>>
        +findAvailableByDoctor(doctorId) List~TimeSlot~
        +findById(slotId) TimeSlot
        +save(slot) void
    }

    User <|-- Patient
    User <|-- Doctor

    Doctor "1" --> "0..*" TimeSlot : publishes
    Patient "1" --> "0..3" Appointment : upcoming (N = 3)
    Doctor "1" --> "0..*" Appointment : receives
    TimeSlot "1" --> "0..1" Appointment : reserved by

    Appointment ..> AppointmentStatus
    TimeSlot ..> SlotStatus

    AvailabilityService ..> SlotRepository
    AvailabilityService ..> TimeSlot : returns
    BookingService ..> BookingPolicy : checks limit
    BookingService ..> AppointmentRepository
    BookingService ..> SlotRepository
    BookingService ..> Appointment : creates
    RequestService ..> AppointmentRepository
    RequestService ..> AccessControl : authorizes
```

## Traceability

| Requirement | Classes / Members |
|---|---|
| R1 View availability | `AvailabilityService.getAvailableSlots`, `TimeSlot`, `SlotStatus` |
| R2 Book appointment | `BookingService.bookAppointment`, `Appointment`, `TimeSlot.reserve` |
| R3 Accept / decline | `RequestService`, `Appointment.accept/decline`, `TimeSlot.lock/release` |
| R4 Max N = 3 upcoming | `BookingPolicy.canBook`, `Appointment.countsTowardLimit`, `Patient.getUpcomingCount` |
| R5 Authorized access | `AccessControl` (RBAC), used by `RequestService` |
| R6 Fast availability (< 2 s) | `AvailabilityService` cache, `SlotRepository` indexed by doctor and date |
| R7 Mobile usable | UI concern, not modeled as domain classes |

## Design Notes

- **Quota rule:** `Appointment.countsTowardLimit()` returns true only for `Pending`/`Accepted` appointments with a future time. `BookingPolicy.canBook` requires that count to be strictly less than 3.
- **Slot lifecycle:** `Available` → `Pending` on booking → `Booked` on accept (locked) → back to `Available` on decline.
- **Race condition (UC-2 4a):** `BookingService` re-checks slot availability atomically when creating the appointment.
- **Inheritance:** `Patient` and `Doctor` extend `User` for shared identity and contact details.