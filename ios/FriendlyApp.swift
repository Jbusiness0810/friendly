import SwiftUI
import FirebaseCore

@main
struct FriendlyApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authViewModel)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        Group {
            if authViewModel.isLoading {
                SplashView()
            } else if authViewModel.currentUser == nil {
                OnboardingView()
            } else if !authViewModel.hasCompletedOnboarding {
                OnboardingFlowView()
            } else {
                MainTabView()
            }
        }
        .animation(.easeInOut, value: authViewModel.currentUser?.id)
    }
}

struct SplashView: View {
    var body: some View {
        ZStack {
            Color("Background")
                .ignoresSafeArea()
            VStack(spacing: 16) {
                Image("friendly-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 120, height: 120)
                Text("Friendly")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                ProgressView()
            }
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            CirclesListView()
                .tabItem {
                    Label("Circles", systemImage: "person.3.fill")
                }
                .tag(1)

            EventsListView()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
                .tag(2)

            MatchesView()
                .tabItem {
                    Label("Matches", systemImage: "heart.fill")
                }
                .tag(3)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(Color("AccentGreen"))
    }
}
