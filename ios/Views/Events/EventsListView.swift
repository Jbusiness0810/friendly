import SwiftUI

struct EventsListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = EventViewModel()
    @State private var showCreateEvent = false
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Events", selection: $selectedTab) {
                    Text("Upcoming").tag(0)
                    Text("My Events").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else {
                    let events = selectedTab == 0 ? viewModel.upcomingEvents : viewModel.myEvents

                    if events.isEmpty {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.plus")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)
                            Text(selectedTab == 0 ? "No upcoming events" : "You haven't joined any events")
                                .font(.headline)
                            Text("Create one to get the ball rolling!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    } else {
                        List(events) { event in
                            NavigationLink(destination: EventDetailView(event: event)) {
                                EventRowView(event: event)
                            }
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Events")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateEvent = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateEvent) {
                CreateEventView(viewModel: viewModel)
            }
            .task {
                if let neighborhoodId = authViewModel.currentUser?.neighborhoodId {
                    viewModel.fetchUpcomingEvents(neighborhoodId: neighborhoodId)
                }
                if let userId = authViewModel.currentUser?.id {
                    viewModel.fetchMyEvents(userId: userId)
                }
            }
            .onDisappear {
                viewModel.cleanup()
            }
        }
    }
}
