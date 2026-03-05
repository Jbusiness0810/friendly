import SwiftUI
import MapKit

struct EventDetailView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    let event: Event

    private var isAttending: Bool {
        guard let userId = authViewModel.currentUser?.id else { return false }
        return event.attendeeIds.contains(userId)
    }

    private var isHost: Bool {
        authViewModel.currentUser?.id == event.hostId
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Event image placeholder
                ZStack {
                    Rectangle()
                        .fill(Color("AccentGreen").opacity(0.15))
                        .frame(height: 200)
                    Image(systemName: event.category.systemImage)
                        .font(.system(size: 60))
                        .foregroundColor(Color("AccentGreen"))
                }

                VStack(alignment: .leading, spacing: 16) {
                    // Title and host
                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.title)
                            .font(.title)
                            .fontWeight(.bold)
                        Text("Hosted by \(event.hostName)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    // Date and time
                    HStack(spacing: 12) {
                        Image(systemName: "calendar")
                            .foregroundColor(Color("AccentGreen"))
                        VStack(alignment: .leading) {
                            Text(event.formattedDate)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(event.formattedTimeRange)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Location
                    HStack(spacing: 12) {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(Color("AccentGreen"))
                        VStack(alignment: .leading) {
                            Text(event.location.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(event.location.address)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Map preview
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: CLLocationCoordinate2D(
                            latitude: event.location.latitude,
                            longitude: event.location.longitude
                        ),
                        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                    )))
                    .frame(height: 150)
                    .cornerRadius(12)

                    // Attendees and cost
                    HStack {
                        Label("\(event.attendeeCount)/\(event.maxAttendees) attending", systemImage: "person.2.fill")
                        Spacer()
                        Text(event.cost.displayText)
                            .fontWeight(.medium)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color("AccentGreen").opacity(0.1))
                            .cornerRadius(8)
                    }
                    .font(.subheadline)

                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("About")
                            .font(.headline)
                        Text(event.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }

                    // Circle link
                    if let circleName = event.circleName {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundColor(Color("AccentGreen"))
                            Text(circleName)
                                .font(.subheadline)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }

                    // Action button
                    if !isHost {
                        Button {
                            Task {
                                guard let userId = authViewModel.currentUser?.id,
                                      let eventId = event.id else { return }
                                if isAttending {
                                    try? await EventViewModel().leaveEvent(eventId: eventId, userId: userId)
                                } else {
                                    try? await EventViewModel().joinEvent(eventId: eventId, userId: userId)
                                }
                            }
                        } label: {
                            Text(isAttending ? "Leave Event" : (event.isFull ? "Join Waitlist" : "Join Event"))
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(isAttending ? Color.red : Color("AccentGreen"))
                                .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
