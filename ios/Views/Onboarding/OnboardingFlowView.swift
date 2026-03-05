import SwiftUI

struct OnboardingFlowView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = OnboardingViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress bar
                ProgressView(value: viewModel.currentStep.progress)
                    .tint(Color("AccentGreen"))
                    .padding(.horizontal)
                    .animation(.easeInOut, value: viewModel.currentStep)

                // Content
                TabView(selection: $viewModel.currentStep) {
                    WelcomeStepView()
                        .tag(OnboardingStep.welcome)

                    LocationStepView(viewModel: viewModel)
                        .tag(OnboardingStep.location)

                    InterestsStepView(viewModel: viewModel)
                        .tag(OnboardingStep.interests)

                    AvailabilityStepView(viewModel: viewModel)
                        .tag(OnboardingStep.availability)

                    BioStepView(viewModel: viewModel)
                        .tag(OnboardingStep.bio)

                    CompleteStepView()
                        .tag(OnboardingStep.complete)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: viewModel.currentStep)

                // Navigation buttons
                HStack {
                    if viewModel.currentStep != .welcome {
                        Button("Back") {
                            viewModel.previousStep()
                        }
                        .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button {
                        if viewModel.currentStep == .complete {
                            Task {
                                if let userId = authViewModel.currentUser?.id {
                                    await viewModel.completeOnboarding(userId: userId)
                                    await authViewModel.updateOnboardingComplete()
                                }
                            }
                        } else {
                            viewModel.nextStep()
                        }
                    } label: {
                        Text(viewModel.currentStep == .complete ? "Get Started" : "Next")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 32)
                            .padding(.vertical, 12)
                            .background(Color("AccentGreen"))
                            .cornerRadius(10)
                    }
                }
                .padding()
            }
        }
    }
}

struct WelcomeStepView: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image("onboarding-welcome")
                .resizable()
                .scaledToFit()
                .frame(height: 250)
            Text("Welcome to Friendly!")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Let's set up your profile so we can connect you with amazing people in your neighborhood.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }
}

struct LocationStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "location.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(Color("AccentGreen"))

            Text("Find Your Neighborhood")
                .font(.title)
                .fontWeight(.bold)

            Text("We'll use your location to connect you with nearby neighbors and local events.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            if let neighborhood = viewModel.neighborhood {
                Text(neighborhood.fullLocationName)
                    .font(.headline)
                    .padding()
                    .background(Color("AccentGreen").opacity(0.1))
                    .cornerRadius(10)
            }

            Button {
                Task { await viewModel.detectLocation() }
            } label: {
                HStack {
                    if viewModel.isLocating {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(viewModel.isLocating ? "Detecting..." : "Detect My Location")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .background(Color("AccentGreen"))
                .cornerRadius(12)
            }
            .disabled(viewModel.isLocating)

            Spacer()
        }
    }
}

struct InterestsStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel

    let columns = [
        GridItem(.adaptive(minimum: 100), spacing: 10)
    ]

    var body: some View {
        VStack(spacing: 20) {
            Text("What are you into?")
                .font(.title)
                .fontWeight(.bold)
            Text("Pick at least 3 interests")
                .foregroundColor(.secondary)

            ScrollView {
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(viewModel.allInterests, id: \.self) { interest in
                        let isSelected = viewModel.selectedInterests.contains(interest)
                        Button {
                            viewModel.toggleInterest(interest)
                        } label: {
                            Text(interest)
                                .font(.subheadline)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(isSelected ? Color("AccentGreen") : Color(.systemGray6))
                                .foregroundColor(isSelected ? .white : .primary)
                                .cornerRadius(20)
                        }
                    }
                }
                .padding()
            }
        }
    }
}

struct AvailabilityStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 20) {
            Text("When are you free?")
                .font(.title)
                .fontWeight(.bold)
            Text("Help us find events that fit your schedule")
                .foregroundColor(.secondary)

            VStack(spacing: 16) {
                AvailabilitySection(title: "Weekdays") {
                    Toggle("Mornings", isOn: $viewModel.selectedAvailability.weekdayMornings)
                    Toggle("Afternoons", isOn: $viewModel.selectedAvailability.weekdayAfternoons)
                    Toggle("Evenings", isOn: $viewModel.selectedAvailability.weekdayEvenings)
                }
                AvailabilitySection(title: "Weekends") {
                    Toggle("Mornings", isOn: $viewModel.selectedAvailability.weekendMornings)
                    Toggle("Afternoons", isOn: $viewModel.selectedAvailability.weekendAfternoons)
                    Toggle("Evenings", isOn: $viewModel.selectedAvailability.weekendEvenings)
                }
            }
            .padding()

            Spacer()
        }
    }
}

struct AvailabilitySection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            content
                .tint(Color("AccentGreen"))
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct BioStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 20) {
            Text("Tell us about yourself")
                .font(.title)
                .fontWeight(.bold)
            Text("A short bio helps neighbors get to know you")
                .foregroundColor(.secondary)

            TextEditor(text: $viewModel.bio)
                .frame(height: 150)
                .padding(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(.systemGray4))
                )
                .padding(.horizontal)

            Text("\(viewModel.bio.count)/300")
                .font(.caption)
                .foregroundColor(viewModel.bio.count > 300 ? .red : .secondary)

            Spacer()
        }
    }
}

struct CompleteStepView: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image("onboarding-complete")
                .resizable()
                .scaledToFit()
                .frame(height: 250)
            Text("You're all set!")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Start exploring your neighborhood, join circles, and meet your new friends.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }
}
