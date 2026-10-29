# Sequence Diagram: Appointment Request / Booking Interaction

Based on `class_diagram.md` (classes: `AvailabilityService`, `BookingService`, `BookingPolicy`, `RequestService`, `AccessControl`, repositories, `TimeSlot`, `Appointment`) and use cases UC-1, UC-2, UC-5 and UC-6. N = 3.

## 1. Main Flow: View Availability, Book, Doctor Accepts

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    actor D as Doctor
    participant AS as AvailabilityService
    participant BS as BookingService
    participant BP as BookingPolicy
    participant RS as RequestService
    participant AC as AccessControl
    participant SR as SlotRepository
    participant AR as AppointmentRepository

    rect
    Note over P,SR: UC-1 View Doctor Availability (R1, R6)
    P->>AS: getAvailableSlots(doctorId)
    AS->>SR: findAvailableByDoctor(doctorId)
    SR-->>AS: List~TimeSlot~ (status = Available)
    AS-->>P: slots sorted by day and time
    end

    rect 
    Note over P,AR: UC-2 Book Appointment (R2, R4)
    P->>BS: bookAppointment(patientId, slotId)
    BS->>AR: findByPatient(patientId)
    AR-->>BS: List~Appointment~
    BS->>BP: canBook(patient)
    Note right of BP: count = future Pending + Accepted<br/>allowed only if count < 3
    BP-->>BS: true
    BS->>SR: findById(slotId)
    SR-->>BS: TimeSlot (Available)
    BS->>SR: slot.reserve() then save(slot)
    Note right of SR: SlotStatus = Pending<br/>atomic check-and-set
    BS->>AR: save(new Appointment, status = Pending)
    BS-->>P: booking request confirmed (Pending)
    end

    rect 
    Note over D,AR: UC-4 / UC-5 Doctor reviews and accepts (R3)
    D->>RS: getRequests(doctorId)
    RS->>AC: canManageAppointment(doctor, appointment)
    AC-->>RS: authorized
    RS->>AR: findByDoctor(doctorId)
    AR-->>RS: pending requests
    RS-->>D: patient name, slot, contact details
    D->>RS: acceptRequest(doctorId, appointmentId)
    RS->>AR: appointment.accept() then save()
    Note right of AR: AppointmentStatus = Accepted
    RS->>SR: slot.lock() then save(slot)
    Note right of SR: SlotStatus = Booked
    RS-->>D: updated confirmation status
    end
```

## 2. Alternative Flows

### 2a. Upcoming Limit Exceeded (UC-2, alt flow 3a)

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant BS as BookingService
    participant AR as AppointmentRepository
    participant BP as BookingPolicy

    P->>BS: bookAppointment(patientId, slotId)
    BS->>AR: findByPatient(patientId)
    AR-->>BS: appointments (3 upcoming Pending/Accepted)
    BS->>BP: canBook(patient)
    BP-->>BS: false (count >= 3)
    BS-->>P: error "Booking rejected: maximum allowed upcoming appointments (N = 3) reached"
    Note over BS: No appointment created, slot stays Available
```

### 2b. Slot Already Taken: Race Condition (UC-2, alt flow 4a)

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant BS as BookingService
    participant BP as BookingPolicy
    participant SR as SlotRepository

    P->>BS: bookAppointment(patientId, slotId)
    BS->>BP: canBook(patient)
    BP-->>BS: true
    BS->>SR: reserve slot (atomic check-and-set)
    SR-->>BS: failed, slot no longer Available
    BS-->>P: error "This slot has already been booked. Please choose another."
    Note over BS: No appointment created
```

### 2c. Doctor Declines Request (UC-6)

```mermaid
sequenceDiagram
    autonumber
    actor D as Doctor
    participant RS as RequestService
    participant AC as AccessControl
    participant AR as AppointmentRepository
    participant SR as SlotRepository

    D->>RS: declineRequest(doctorId, appointmentId)
    RS->>AC: canManageAppointment(doctor, appointment)
    AC-->>RS: authorized
    RS->>AR: findByDoctor(doctorId), verify status = Pending
    RS->>AR: appointment.decline() then save()
    Note right of AR: AppointmentStatus = Declined<br/>no longer counts toward N = 3
    RS->>SR: slot.release() then save(slot)
    Note right of SR: SlotStatus = Available again
    RS-->>D: request declined
```

## Notes

- **Quota check (R4):** `BookingService` loads the patient's appointments and `BookingPolicy.canBook` counts only future `Pending` and `Accepted` ones, matching `Appointment.countsTowardLimit()` in the class diagram. The check runs before any slot is touched, so a rejected booking leaves the slot `Available`.
- **Slot lifecycle:** `Available` → `Pending` (on booking) → `Booked` (on accept) or back to `Available` (on decline).
- **Race condition:** slot reservation is an atomic check-and-set in `SlotRepository`, so only one of two simultaneous bookings succeeds.
- **Authorization (R5):** `RequestService` calls `AccessControl` before returning requests or changing an appointment, so a doctor only sees and manages their own appointments.
- **Performance (R6):** `AvailabilityService` may serve slots from its cache; the repository query is indexed by doctor and date.