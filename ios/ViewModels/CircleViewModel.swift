import Foundation
import FirebaseFirestore
import Combine

@MainActor
class CircleViewModel: ObservableObject {
    @Published var circles: [Circle] = []
    @Published var myCircles: [Circle] = []
    @Published var nearbyCircles: [Circle] = []
    @Published var selectedCircle: Circle?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private var listeners: [ListenerRegistration] = []

    func fetchCircles(forNeighborhood neighborhoodId: String) {
        isLoading = true
        let listener = db.collection("circles")
            .whereField("neighborhoodId", isEqualTo: neighborhoodId)
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                self.isLoading = false

                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                self.circles = snapshot?.documents.compactMap {
                    try? $0.data(as: Circle.self)
                } ?? []
            }
        listeners.append(listener)
    }

    func fetchMyCircles(userId: String) {
        let listener = db.collection("circles")
            .whereField("memberIds", arrayContains: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }
                self.myCircles = snapshot?.documents.compactMap {
                    try? $0.data(as: Circle.self)
                } ?? []
            }
        listeners.append(listener)
    }

    func createCircle(_ circle: Circle) async throws {
        try db.collection("circles").addDocument(from: circle)
    }

    func joinCircle(circleId: String, userId: String) async throws {
        try await db.collection("circles").document(circleId).updateData([
            "memberIds": FieldValue.arrayUnion([userId])
        ])
        try await db.collection("users").document(userId).updateData([
            "circleIds": FieldValue.arrayUnion([circleId])
        ])
    }

    func leaveCircle(circleId: String, userId: String) async throws {
        try await db.collection("circles").document(circleId).updateData([
            "memberIds": FieldValue.arrayRemove([userId])
        ])
        try await db.collection("users").document(userId).updateData([
            "circleIds": FieldValue.arrayRemove([circleId])
        ])
    }

    func cleanup() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
    }
}
