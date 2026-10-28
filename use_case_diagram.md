# Use Case Diagram

This diagram visualizes the primary actors and use cases for the **Doctor Appointment Booking System**, modeling functional requirements **R1–R4** with quota limit **N = 3**.

## Mermaid Diagram

```mermaid
flowchart LR
    %% Actors
    Patient["Patient"]
    Doctor["Doctor"]

    %% System Boundary
    subgraph SystemBoundary ["Doctor Appointment Booking System (N = 3)"]
        UC1(["UC-1: View Doctor Availability<br/><b>[R1]</b>"])
        UC2(["UC-2: Book Appointment<br/><b>[R2, R4]</b>"])
        UC3(["UC-3: View Upcoming Appointments<br/><b>[R4]</b>"])
        UC4(["UC-4: View Appointment Requests<br/><b>[R3]</b>"])
        UC5(["UC-5: Accept Appointment Request<br/><b>[R3]</b>"])
        UC6(["UC-6: Decline Appointment Request<br/><b>[R3, R4]</b>"])
        
        RuleCheck(["Validate Upcoming Count &lt; N (N = 3)<br/><b>[R4 Rule]</b>"]):::ruleStyle
        FreeSlot(["Release Doctor Slot<br/><b>[Slot Management]</b>"]):::ruleStyle
    end

    %% Patient Associations
    Patient --> UC1
    Patient --> UC2
    Patient --> UC3

    %% Doctor Associations
    Doctor --> UC4
    Doctor --> UC5
    Doctor --> UC6

    %% Relationships
    UC2 -.->|&lt;&lt;include&gt;&gt;| RuleCheck
    UC6 -.->|&lt;&lt;include&gt;&gt;| FreeSlot

    classDef ruleStyle stroke-dasharray: 5 5,stroke:#4a5568,fill:#edf2f7;
```

---

## Diagram Elements Description

### 1. Actors
* **Patient**: Can inspect available doctor schedules, initiate booking requests, and monitor upcoming appointment quotas.
* **Doctor**: Can monitor incoming consultation requests and decide to accept or decline each request.

### 2. Core Use Cases & Requirements Mapping
* **UC-1: View Doctor Availability (R1)**: Patient views available dates and times for any doctor.
* **UC-2: Book Appointment (R2, R4)**: Patient reserves an available slot. System automatically includes a check to ensure the patient has fewer than N = 3 upcoming appointments.
* **UC-3: View Upcoming Appointments (R4)**: Patient views current active appointments (Pending + Accepted).
* **UC-4: View Appointment Requests (R3)**: Doctor views incoming appointment requests.
* **UC-5: Accept Appointment Request (R3)**: Doctor accepts a pending appointment.
* **UC-6: Decline Appointment Request (R3, R4)**: Doctor declines a pending appointment, which frees the time slot and removes it from the patient's upcoming quota.
