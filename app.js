/**
 * Doctor Appointment Booking System
 * Domain Model & Client Application Logic
 * Conforming to:
 * - Requirements Specification (R1-R7, N = 3)
 * - Domain Class Diagram (Class_Diagram.md)
 * - Sequence Diagrams (Sequence_Diagram.md)
 */

// ==========================================================================
// 1. DOMAIN MODEL (Entities matching Class_Diagram.md)
// ==========================================================================

class User {
  constructor(id, name, email, phone) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
  }

  getContactDetails() {
    return `${this.name} (${this.email}, ${this.phone})`;
  }
}

class Patient extends User {
  constructor(id, name, email, phone) {
    super(id, name, email, phone);
    this.patientId = id;
  }
}

class Doctor extends User {
  constructor(id, name, specialty, email, phone) {
    super(id, name, email, phone);
    this.doctorId = id;
    this.specialty = specialty;
  }
}

/**
 * SlotStatus Enumeration: 'Available', 'Pending', 'Booked'
 */
class TimeSlot {
  constructor(slotId, doctorId, startTime, endTime, status = 'Available') {
    this.slotId = Number(slotId);
    this.doctorId = Number(doctorId);
    this.startTime = new Date(startTime).toISOString();
    this.endTime = new Date(endTime).toISOString();
    this.status = status; // Available | Pending | Booked
  }

  isAvailable() {
    return this.status === 'Available';
  }

  reserve() {
    if (!this.isAvailable()) {
      throw new Error('This slot has already been booked. Please choose another.');
    }
    this.status = 'Pending';
  }

  lock() {
    this.status = 'Booked';
  }

  release() {
    this.status = 'Available';
  }
}

/**
 * AppointmentStatus Enumeration: 'Pending', 'Accepted', 'Declined', 'Cancelled'
 */
class Appointment {
  constructor(appointmentId, patientId, doctorId, slotId, status = 'Pending', createdAt = new Date().toISOString()) {
    this.appointmentId = Number(appointmentId);
    this.patientId = Number(patientId);
    this.doctorId = Number(doctorId);
    this.slotId = Number(slotId);
    this.status = status; // Pending | Accepted | Declined | Cancelled
    this.createdAt = createdAt;
  }

  /**
   * Evaluates if appointment counts toward upcoming limit N = 3.
   * Requirement R4: Count future Pending + Accepted appointments.
   * Declined, Cancelled, and past appointments do NOT count.
   */
  countsTowardLimit(slot) {
    if (!slot) return false;
    const isFuture = new Date(slot.startTime).getTime() > Date.now();
    const isActiveStatus = this.status === 'Pending' || this.status === 'Accepted';
    return isFuture && isActiveStatus;
  }

  accept() {
    if (this.status !== 'Pending') {
      throw new Error(`Cannot accept an appointment with status: ${this.status}`);
    }
    this.status = 'Accepted';
  }

  decline() {
    if (this.status !== 'Pending') {
      throw new Error(`Cannot decline an appointment with status: ${this.status}`);
    }
    this.status = 'Declined';
  }

  cancel() {
    if (this.status === 'Declined' || this.status === 'Cancelled') {
      throw new Error(`Appointment already ${this.status}`);
    }
    this.status = 'Cancelled';
  }
}

// ==========================================================================
// 2. BUSINESS SERVICES (Traceable to Class & Sequence Diagrams)
// ==========================================================================

class BookingPolicy {
  static MAX_UPCOMING = 3; // Configured N = 3

  static getMaxUpcoming() {
    return this.MAX_UPCOMING;
  }

  /**
   * Requirement R4: A patient can have at most N upcoming appointments at any given time.
   * Allowed only if current upcoming count < N.
   */
  static canBook(activeUpcomingAppointments) {
    return activeUpcomingAppointments.length < this.MAX_UPCOMING;
  }
}

class StorageService {
  static STORAGE_KEY = 'doctor_booking_db_v1';

  static loadData() {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('localStorage read error, falling back to initial data', e);
    }
    return this.getInitialSeedData();
  }

  static saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  static reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.getInitialSeedData();
  }

  static getInitialSeedData() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Helper to generate future ISO date
    const futureDate = (daysAhead, hours, minutes) => {
      const d = new Date(now + daysAhead * dayMs);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    };

    return {
      currentPatient: {
        id: 101,
        name: 'Yehia Hassan',
        email: 'yehia.hassan@example.com',
        phone: '+20 100 244 7000'
      },
      doctors: [
        { id: 1, name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', email: 's.jenkins@hospital.org', phone: '+20 111 555 0101' },
        { id: 2, name: 'Dr. Alex Smith', specialty: 'Pediatrics', email: 'a.smith@hospital.org', phone: '+20 111 555 0102' },
        { id: 3, name: 'Dr. Mona Zaki', specialty: 'Neurology', email: 'm.zaki@hospital.org', phone: '+20 111 555 0103' }
      ],
      slots: [
        // Dr. Sarah Jenkins (ID: 1)
        { slotId: 1, doctorId: 1, startTime: futureDate(1, 9, 30), endTime: futureDate(1, 10, 0), status: 'Available' },
        { slotId: 2, doctorId: 1, startTime: futureDate(1, 11, 0), endTime: futureDate(1, 11, 30), status: 'Available' },
        { slotId: 3, doctorId: 1, startTime: futureDate(2, 14, 0), endTime: futureDate(2, 14, 30), status: 'Available' },
        { slotId: 4, doctorId: 1, startTime: futureDate(3, 16, 0), endTime: futureDate(3, 16, 30), status: 'Available' },

        // Dr. Alex Smith (ID: 2)
        { slotId: 5, doctorId: 2, startTime: futureDate(1, 10, 0), endTime: futureDate(1, 10, 30), status: 'Available' },
        { slotId: 6, doctorId: 2, startTime: futureDate(1, 13, 0), endTime: futureDate(1, 13, 30), status: 'Available' },
        { slotId: 7, doctorId: 2, startTime: futureDate(2, 15, 30), endTime: futureDate(2, 16, 0), status: 'Available' },

        // Dr. Mona Zaki (ID: 3)
        { slotId: 8, doctorId: 3, startTime: futureDate(1, 12, 0), endTime: futureDate(1, 12, 30), status: 'Available' },
        { slotId: 9, doctorId: 3, startTime: futureDate(3, 11, 30), endTime: futureDate(3, 12, 0), status: 'Available' }
      ],
      appointments: []
    };
  }
}

class AvailabilityService {
  constructor(data) {
    this.data = data;
  }

  /**
   * Requirement R1: A patient can view days and times when a doctor is available.
   * Requirement R6: Available times displayed within 2 seconds.
   */
  getAvailableSlots(doctorId) {
    const docId = Number(doctorId);
    return this.data.slots
      .filter(s => s.doctorId === docId && s.status === 'Available')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }
}

class BookingService {
  constructor(data) {
    this.data = data;
  }

  getPatientAppointments(patientId) {
    const pId = Number(patientId);
    return this.data.appointments
      .filter(a => a.patientId === pId)
      .sort((a, b) => b.appointmentId - a.appointmentId);
  }

  getActiveUpcoming(patientId) {
    const appointments = this.getPatientAppointments(patientId);
    return appointments.filter(a => {
      const slot = this.data.slots.find(s => s.slotId === a.slotId);
      const apptInstance = new Appointment(a.appointmentId, a.patientId, a.doctorId, a.slotId, a.status, a.createdAt);
      return apptInstance.countsTowardLimit(slot);
    });
  }

  /**
   * Requirement R2 & R4:
   * Book appointment while validating quota limit N = 3.
   */
  bookAppointment(patientId, slotId) {
    const pId = Number(patientId);
    const sId = Number(slotId);

    // 1. Check patient quota (R4)
    const activeUpcoming = this.getActiveUpcoming(pId);
    if (!BookingPolicy.canBook(activeUpcoming)) {
      throw new Error(`Booking rejected: maximum allowed upcoming appointments (N = ${BookingPolicy.MAX_UPCOMING}) reached.`);
    }

    // 2. Check and reserve slot (Atomic check-and-set)
    const slotRaw = this.data.slots.find(s => s.slotId === sId);
    if (!slotRaw) {
      throw new Error('Selected time slot not found.');
    }

    const slot = new TimeSlot(slotRaw.slotId, slotRaw.doctorId, slotRaw.startTime, slotRaw.endTime, slotRaw.status);
    slot.reserve(); // Throws if not Available
    slotRaw.status = slot.status; // 'Pending'

    // 3. Create appointment with Pending status
    const newAppointmentId = this.data.appointments.length > 0
      ? Math.max(...this.data.appointments.map(a => a.appointmentId)) + 1
      : 1;

    const newAppt = new Appointment(newAppointmentId, pId, slotRaw.doctorId, sId, 'Pending');
    this.data.appointments.push({
      appointmentId: newAppt.appointmentId,
      patientId: newAppt.patientId,
      doctorId: newAppt.doctorId,
      slotId: newAppt.slotId,
      status: newAppt.status,
      createdAt: newAppt.createdAt
    });

    StorageService.saveData(this.data);
    return newAppt;
  }

  cancelAppointment(patientId, appointmentId) {
    const apptRaw = this.data.appointments.find(a => a.appointmentId === Number(appointmentId) && a.patientId === Number(patientId));
    if (!apptRaw) {
      throw new Error('Appointment not found.');
    }

    const appt = new Appointment(apptRaw.appointmentId, apptRaw.patientId, apptRaw.doctorId, apptRaw.slotId, apptRaw.status);
    appt.cancel();
    apptRaw.status = appt.status;

    // Release slot back to Available
    const slotRaw = this.data.slots.find(s => s.slotId === apptRaw.slotId);
    if (slotRaw) {
      slotRaw.status = 'Available';
    }

    StorageService.saveData(this.data);
    return appt;
  }
}

class RequestService {
  constructor(data) {
    this.data = data;
  }

  /**
   * Requirement R3: Doctor reviews incoming requests.
   * Requirement R5: RBAC - doctor only views requests for their own doctorId.
   */
  getRequests(doctorId) {
    const docId = Number(doctorId);
    return this.data.appointments
      .filter(a => a.doctorId === docId && a.status === 'Pending')
      .map(a => {
        const slot = this.data.slots.find(s => s.slotId === a.slotId);
        return {
          ...a,
          slot
        };
      })
      .sort((a, b) => new Date(a.slot.startTime) - new Date(b.slot.startTime));
  }

  getConfirmedAppointments(doctorId) {
    const docId = Number(doctorId);
    return this.data.appointments
      .filter(a => a.doctorId === docId && a.status === 'Accepted')
      .map(a => {
        const slot = this.data.slots.find(s => s.slotId === a.slotId);
        return {
          ...a,
          slot
        };
      })
      .sort((a, b) => new Date(a.slot.startTime) - new Date(b.slot.startTime));
  }

  /**
   * Requirement R3: Doctor accepts an appointment.
   */
  acceptRequest(doctorId, appointmentId) {
    const docId = Number(doctorId);
    const apptId = Number(appointmentId);

    const apptRaw = this.data.appointments.find(a => a.appointmentId === apptId && a.doctorId === docId);
    if (!apptRaw) {
      throw new Error('Appointment request not found or unauthorized.');
    }

    const appt = new Appointment(apptRaw.appointmentId, apptRaw.patientId, apptRaw.doctorId, apptRaw.slotId, apptRaw.status);
    appt.accept();
    apptRaw.status = appt.status;

    // Lock slot to Booked
    const slotRaw = this.data.slots.find(s => s.slotId === apptRaw.slotId);
    if (slotRaw) {
      const slot = new TimeSlot(slotRaw.slotId, slotRaw.doctorId, slotRaw.startTime, slotRaw.endTime, slotRaw.status);
      slot.lock();
      slotRaw.status = slot.status; // 'Booked'
    }

    StorageService.saveData(this.data);
    return appt;
  }

  /**
   * Requirement R3 & R4: Doctor declines an appointment request.
   * Frees up slot and releases patient's upcoming quota.
   */
  declineRequest(doctorId, appointmentId) {
    const docId = Number(doctorId);
    const apptId = Number(appointmentId);

    const apptRaw = this.data.appointments.find(a => a.appointmentId === apptId && a.doctorId === docId);
    if (!apptRaw) {
      throw new Error('Appointment request not found or unauthorized.');
    }

    const appt = new Appointment(apptRaw.appointmentId, apptRaw.patientId, apptRaw.doctorId, apptRaw.slotId, apptRaw.status);
    appt.decline();
    apptRaw.status = appt.status;

    // Release slot back to Available
    const slotRaw = this.data.slots.find(s => s.slotId === apptRaw.slotId);
    if (slotRaw) {
      const slot = new TimeSlot(slotRaw.slotId, slotRaw.doctorId, slotRaw.startTime, slotRaw.endTime, slotRaw.status);
      slot.release();
      slotRaw.status = slot.status; // 'Available'
    }

    StorageService.saveData(this.data);
    return appt;
  }
}

// ==========================================================================
// 3. UI CONTROLLER & EVENT LISTENERS
// ==========================================================================

class AppController {
  constructor() {
    this.data = StorageService.loadData();
    this.availabilityService = new AvailabilityService(this.data);
    this.bookingService = new BookingService(this.data);
    this.requestService = new RequestService(this.data);

    this.selectedDoctorId = this.data.doctors[0]?.id || 1;
    this.activeDoctorProfileId = this.data.doctors[0]?.id || 1;
    this.currentView = 'patient';
  }

  init() {
    this.populateDoctorDropdowns();
    this.render();
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    const tabBtn = document.getElementById(`tab-${viewName}`);
    const viewSec = document.getElementById(`${viewName}-view`);
    if (tabBtn) tabBtn.classList.add('active');
    if (viewSec) viewSec.classList.add('active');

    this.render();
  }

  populateDoctorDropdowns() {
    const doctorSelect = document.getElementById('doctor-select');
    const doctorProfileSelect = document.getElementById('doctor-profile-select');

    if (doctorSelect) {
      doctorSelect.innerHTML = this.data.doctors
        .map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`)
        .join('');
      doctorSelect.value = String(this.selectedDoctorId);
    }

    if (doctorProfileSelect) {
      doctorProfileSelect.innerHTML = this.data.doctors
        .map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`)
        .join('');
      doctorProfileSelect.value = String(this.activeDoctorProfileId);
    }
  }

  onDoctorSelectChange() {
    const sel = document.getElementById('doctor-select');
    if (sel) {
      this.selectedDoctorId = Number(sel.value);
      this.renderAvailableSlots();
    }
  }

  onDoctorProfileChange() {
    const sel = document.getElementById('doctor-profile-select');
    if (sel) {
      this.activeDoctorProfileId = Number(sel.value);
      this.renderDoctorPortal();
    }
  }

  render() {
    this.renderQuotaTracker();
    this.renderAvailableSlots();
    this.renderPatientAppointments();
    this.renderDoctorPortal();
  }

  renderQuotaTracker() {
    const activeUpcoming = this.bookingService.getActiveUpcoming(this.data.currentPatient.id);
    const count = activeUpcoming.length;
    const max = BookingPolicy.getMaxUpcoming();

    const badge = document.getElementById('quota-badge');
    const alertBox = document.getElementById('quota-alert');

    if (badge) {
      badge.textContent = `${count} / ${max} Upcoming`;
      if (count >= max) {
        badge.className = 'quota-badge quota-full';
        if (alertBox) alertBox.style.display = 'block';
      } else {
        badge.className = 'quota-badge quota-ok';
        if (alertBox) alertBox.style.display = 'none';
      }
    }
  }

  renderAvailableSlots() {
    const container = document.getElementById('available-slots-list');
    if (!container) return;

    const slots = this.availabilityService.getAvailableSlots(this.selectedDoctorId);
    const activeUpcoming = this.bookingService.getActiveUpcoming(this.data.currentPatient.id);
    const isQuotaFull = !BookingPolicy.canBook(activeUpcoming);

    if (slots.length === 0) {
      container.innerHTML = `<div class="empty-state">No upcoming available slots for this doctor.</div>`;
      return;
    }

    container.innerHTML = slots.map(slot => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return `
        <div class="slot-item">
          <div class="slot-info">
            <span class="slot-date">${dateStr}</span>
            <span class="slot-time">${timeStr}</span>
            <span class="status-badge status-available">Available</span>
          </div>
          <div class="slot-action">
            <button 
              class="btn btn-primary" 
              onclick="app.bookSlot(${slot.slotId})"
              ${isQuotaFull ? 'disabled title="Quota limit reached (N = 3)"' : ''}>
              Book Slot
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPatientAppointments() {
    const upcomingContainer = document.getElementById('patient-upcoming-list');
    const historyContainer = document.getElementById('patient-history-list');

    const allAppointments = this.bookingService.getPatientAppointments(this.data.currentPatient.id);

    const upcoming = [];
    const history = [];

    allAppointments.forEach(appt => {
      const slot = this.data.slots.find(s => s.slotId === appt.slotId);
      const doctor = this.data.doctors.find(d => d.id === appt.doctorId);
      const apptInstance = new Appointment(appt.appointmentId, appt.patientId, appt.doctorId, appt.slotId, appt.status, appt.createdAt);

      const itemData = { ...appt, slot, doctor };
      if (apptInstance.countsTowardLimit(slot)) {
        upcoming.push(itemData);
      } else {
        history.push(itemData);
      }
    });

    // Render Upcoming
    if (upcomingContainer) {
      if (upcoming.length === 0) {
        upcomingContainer.innerHTML = `<div class="empty-state">No active upcoming appointments.</div>`;
      } else {
        upcomingContainer.innerHTML = upcoming.map(item => {
          const start = new Date(item.slot.startTime);
          const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const statusClass = `status-${item.status.toLowerCase()}`;

          return `
            <div class="appointment-item">
              <div class="appointment-info">
                <span class="slot-date">${item.doctor ? item.doctor.name : 'Doctor'} (${item.doctor?.specialty || ''})</span>
                <span class="slot-time">${dateStr} at ${timeStr}</span>
                <div>
                  <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
              </div>
              <div class="actions-group">
                <button class="btn btn-secondary btn-sm" onclick="app.cancelBooking(${item.appointmentId})">
                  Cancel
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render History
    if (historyContainer) {
      if (history.length === 0) {
        historyContainer.innerHTML = `<div class="empty-state">No historical or concluded appointments.</div>`;
      } else {
        historyContainer.innerHTML = history.map(item => {
          const start = item.slot ? new Date(item.slot.startTime) : new Date(item.createdAt);
          const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const statusClass = `status-${item.status.toLowerCase()}`;

          return `
            <div class="appointment-item">
              <div class="appointment-info">
                <span class="slot-date">${item.doctor ? item.doctor.name : 'Doctor'}</span>
                <span class="slot-time">${dateStr}</span>
                <div>
                  <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  renderDoctorPortal() {
    const requestsContainer = document.getElementById('doctor-requests-list');
    const confirmedContainer = document.getElementById('doctor-confirmed-list');
    const countBadge = document.getElementById('pending-requests-count');

    const requests = this.requestService.getRequests(this.activeDoctorProfileId);
    const confirmed = this.requestService.getConfirmedAppointments(this.activeDoctorProfileId);

    if (countBadge) {
      countBadge.textContent = `${requests.length} Pending`;
    }

    // Render Requests
    if (requestsContainer) {
      if (requests.length === 0) {
        requestsContainer.innerHTML = `<div class="empty-state">No pending requests for this doctor.</div>`;
      } else {
        requestsContainer.innerHTML = requests.map(req => {
          const start = new Date(req.slot.startTime);
          const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const patientName = this.data.currentPatient.name;
          const patientContact = this.data.currentPatient.phone;

          return `
            <div class="request-item">
              <div class="request-info">
                <span class="slot-date">Patient: ${patientName}</span>
                <span class="slot-time">Slot: ${dateStr} at ${timeStr}</span>
                <span class="slot-doctor">Contact: ${patientContact}</span>
                <div>
                  <span class="status-badge status-pending">Pending Review</span>
                </div>
              </div>
              <div class="actions-group">
                <button class="btn btn-success btn-sm" onclick="app.acceptRequest(${req.appointmentId})">
                  Accept
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.declineRequest(${req.appointmentId})">
                  Decline
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Confirmed
    if (confirmedContainer) {
      if (confirmed.length === 0) {
        confirmedContainer.innerHTML = `<div class="empty-state">No confirmed appointments scheduled yet.</div>`;
      } else {
        confirmedContainer.innerHTML = confirmed.map(item => {
          const start = new Date(item.slot.startTime);
          const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return `
            <div class="slot-item">
              <div class="slot-info">
                <span class="slot-date">Patient: ${this.data.currentPatient.name}</span>
                <span class="slot-time">${dateStr} at ${timeStr}</span>
                <div>
                  <span class="status-badge status-accepted">Confirmed (Booked)</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  bookSlot(slotId) {
    try {
      this.bookingService.bookAppointment(this.data.currentPatient.id, slotId);
      this.showToast('Appointment requested successfully! Status: Pending doctor review.', 'success');
      this.render();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  cancelBooking(appointmentId) {
    try {
      this.bookingService.cancelAppointment(this.data.currentPatient.id, appointmentId);
      this.showToast('Appointment cancelled.', 'info');
      this.render();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  acceptRequest(appointmentId) {
    try {
      this.requestService.acceptRequest(this.activeDoctorProfileId, appointmentId);
      this.showToast('Appointment accepted and locked as booked.', 'success');
      this.render();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  declineRequest(appointmentId) {
    try {
      this.requestService.declineRequest(this.activeDoctorProfileId, appointmentId);
      this.showToast('Appointment declined. Slot has been freed for other patients.', 'info');
      this.render();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  resetDemoData() {
    this.data = StorageService.reset();
    this.availabilityService.data = this.data;
    this.bookingService.data = this.data;
    this.requestService.data = this.data;
    this.populateDoctorDropdowns();
    this.render();
    this.showToast('All demo slots and appointments reset to initial state.', 'info');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }
}

// Global instance initialized on DOM load
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new AppController();
  app.init();
});
