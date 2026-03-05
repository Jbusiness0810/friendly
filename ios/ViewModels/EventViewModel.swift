import Foundation
import FirebaseFirestore
import Combine

@MainActor
class EventViewModel: ObservableObject {
    @Published var upcomingEvents: [Event] = []
    @Published var myEvents: [Event] = []
    @Published var circleEvents: [Event] = []
    @Published var selectedEvent: Event?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private var listeners: [ListenerRegistration] = []

    func fetchUpcomingEvents(neighborhoodId: String) {
        isLoading = true
        let listener = db.collection("events")
            .whereField("location.neighborhoodId", isEqualTo: neighborhoodId)
            .whereField("startDate", isGreaterThan: Timestamp(date: Date()))
            .whereField("isCancelled", isEqualTo: false)
            .order(by: "startDate")
            .limit(to: 50)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                self.isLoading = false

                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                self.upcomingEvents = snapshot?.documents.compactMap {
                    try? $0.data(as: Event.self)
                } ?? []
            }
        listeners.append(listener)
    }

    func fetchMyEvents(userId: String) {
        let listener = db.collection("events")
            .whereField("attendeeIds", arrayContains: userId)
            .whereField("startDate", isGreaterThan: Timestamp(date: Date()))
            .order(by: "startDate")
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }
                self.myEvents = snapshot?.documents.compactMap {
                    try? $0.data(as: Event.self)
                } ?? []
            }
        listeners.append(listener)
    }

    func fetchEvents(forCircle circleId: String) {
        let listener = db.collection("events")
            .whereField("circleId", isEqualTo: circleId)
            .whereField("startDate", isGreaterThan: Timestamp(date: Date()))
            .order(by: "startDate")
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }
                self.circleEvents = snapshot?.documents.compactMap {
                    try? $0.data(as: Event.self)
                } ?? []
            }
        listeners.append(listener)
    }

    func createEvent(_ event: Event) async throws {
        try db.collection("events").addDocument(from: event)
    }

    func joinEvent(eventId: String, userId: String) async throws {
        let ref = db.collection("events").document(eventId)
        let snapshot = try await ref.getDocument()
        guard let event = try? snapshot.data(as: Event.self) else { return }

        if event.isFull {
            try await ref.updateData([
                "waitlistIds": FieldValue.arrayUnion([userId])
            ])
        } else {
            try await ref.updateData([
                "attendeeIds": FieldValue.arrayUnion([userId])
            ])
        }
    }

    func leaveEvent(eventId: String, userId: String) async throws {
        try await db.collection("events").document(eventId).updateData([
            "attendeeIds": FieldValue.arrayRemove([userId]),
            "waitlistIds": FieldValue.arrayRemove([userId])
        ])
    }

    func cancelEvent(eventId: String) async throws {
        try await db.collection("events").document(eventId).updateData([
            "isCancelled": true
        ])
    }

    func cleanup() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
    }
}
