import Foundation
import CoreLocation
import FirebaseFirestore

@MainActor
class OnboardingViewModel: ObservableObject {
    @Published var currentStep: OnboardingStep = .welcome
    @Published var selectedInterests: Set<String> = []
    @Published var selectedAvailability = Availability()
    @Published var neighborhood: Neighborhood?
    @Published var bio: String = ""
    @Published var isLocating = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private let locationService = LocationService()

    let allInterests = [
        "Running", "Yoga", "Cycling", "Hiking",
        "Cooking", "Baking", "Coffee", "Wine",
        "Reading", "Writing", "Photography", "Art",
        "Board Games", "Video Games", "Trivia",
        "Music", "Dancing", "Karaoke",
        "Gardening", "Volunteering", "Dog Walking",
        "Meditation", "Tech", "Movies"
    ]

    func nextStep() {
        switch currentStep {
        case .welcome: currentStep = .location
        case .location: currentStep = .interests
        case .interests: currentStep = .availability
        case .availability: currentStep = .bio
        case .bio: currentStep = .complete
        case .complete: break
        }
    }

    func previousStep() {
        switch currentStep {
        case .welcome: break
        case .location: currentStep = .welcome
        case .interests: currentStep = .location
        case .availability: currentStep = .interests
        case .bio: currentStep = .availability
        case .complete: currentStep = .bio
        }
    }

    func detectLocation() async {
        isLocating = true
        defer { isLocating = false }

        do {
            let location = try await locationService.getCurrentLocation()
            neighborhood = try await findNeighborhood(near: location)
        } catch {
            errorMessage = "Could not detect your location. Please try again."
        }
    }

    private func findNeighborhood(near location: CLLocation) async throws -> Neighborhood? {
        let snapshot = try await db.collection("neighborhoods")
            .limit(to: 1)
            .getDocuments()

        return snapshot.documents.first.flatMap { try? $0.data(as: Neighborhood.self) }
    }

    func toggleInterest(_ interest: String) {
        if selectedInterests.contains(interest) {
            selectedInterests.remove(interest)
        } else {
            selectedInterests.insert(interest)
        }
    }

    func completeOnboarding(userId: String) async {
        do {
            try await db.collection("users").document(userId).updateData([
                "interests": Array(selectedInterests),
                "availability": try Firestore.Encoder().encode(selectedAvailability),
                "bio": bio,
                "neighborhoodId": neighborhood?.id ?? "",
                "hasCompletedOnboarding": true,
                "lastActiveAt": Timestamp(date: Date())
            ])
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

enum OnboardingStep: Int, CaseIterable {
    case welcome
    case location
    case interests
    case availability
    case bio
    case complete

    var title: String {
        switch self {
        case .welcome: return "Welcome"
        case .location: return "Your Neighborhood"
        case .interests: return "Your Interests"
        case .availability: return "Your Availability"
        case .bio: return "About You"
        case .complete: return "All Set!"
        }
    }

    var progress: Double {
        Double(rawValue) / Double(OnboardingStep.allCases.count - 1)
    }
}
