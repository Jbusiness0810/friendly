import SwiftUI

struct CreateEventView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @ObservedObject var viewModel: EventViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var description = ""
    @State private var locationName = ""
    @State private var locationAddress = ""
    @State private var startDate = Date().addingTimeInterval(86400)
    @State private var endDate = Date().addingTimeInterval(86400 + 7200)
    @State private var maxAttendees = 10
    @State private var category: CircleCategory = .social
    @State private var isOutdoor = false
    @State private var isFree = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Event Details") {
                    TextField("Event Title", text: $title)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    Picker("Category", selection: $category) {
                        ForEach(CircleCategory.allCases, id: \.self) { cat in
                            Text(cat.rawValue).tag(cat)
                        }
                    }
                }

                Section("Location") {
                    TextField("Location Name", text: $locationName)
                    TextField("Address", text: $locationAddress)
                    Toggle("Outdoor Event", isOn: $isOutdoor)
                }

                Section("Date & Time") {
                    DatePicker("Start", selection: $startDate, in: Date()...)
                    DatePicker("End", selection: $endDate, in: startDate...)
                }

                Section("Settings") {
                    Stepper("Max Attendees: \(maxAttendees)", value: $maxAttendees, in: 2...100)
                    Toggle("Free Event", isOn: $isFree)
                }
            }
            .navigationTitle("Create Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            let event = Event(
                                title: title,
                                description: description,
                                hostId: authViewModel.currentUser?.id ?? "",
                                hostName: authViewModel.currentUser?.displayName ?? "",
                                location: EventLocation(
                                    name: locationName,
                                    address: locationAddress,
                                    latitude: 0,
                                    longitude: 0
                                ),
                                startDate: startDate,
                                endDate: endDate,
                                maxAttendees: maxAttendees,
                                attendeeIds: [authViewModel.currentUser?.id ?? ""],
                                waitlistIds: [],
                                category: category,
                                isOutdoor: isOutdoor,
                                cost: isFree ? .free : .splitEvenly,
                                createdAt: Date(),
                                isCancelled: false
                            )
                            try? await viewModel.createEvent(event)
                            dismiss()
                        }
                    }
                    .disabled(title.isEmpty || locationName.isEmpty)
                }
            }
        }
    }
}
