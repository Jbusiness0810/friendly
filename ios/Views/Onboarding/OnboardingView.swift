import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var isSignUp = true
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color("AccentGreen").opacity(0.3), Color("Background")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 32) {
                        // Logo
                        VStack(spacing: 12) {
                            Image("friendly-logo")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 100, height: 100)
                            Text("Friendly")
                                .font(.system(size: 36, weight: .bold))
                            Text("Meet your neighbors")
                                .font(.title3)
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 60)

                        // Form
                        VStack(spacing: 16) {
                            if isSignUp {
                                TextField("Display Name", text: $displayName)
                                    .textFieldStyle(.roundedBorder)
                                    .textContentType(.name)
                                    .autocorrectionDisabled()
                            }

                            TextField("Email", text: $email)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)

                            SecureField("Password", text: $password)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(isSignUp ? .newPassword : .password)

                            if let error = authViewModel.errorMessage {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.red)
                                    .multilineTextAlignment(.center)
                            }

                            Button {
                                Task {
                                    if isSignUp {
                                        await authViewModel.signUp(
                                            email: email,
                                            password: password,
                                            displayName: displayName
                                        )
                                    } else {
                                        await authViewModel.signIn(
                                            email: email,
                                            password: password
                                        )
                                    }
                                }
                            } label: {
                                Text(isSignUp ? "Create Account" : "Sign In")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color("AccentGreen"))
                                    .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal, 32)

                        Button {
                            isSignUp.toggle()
                        } label: {
                            Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                                .font(.subheadline)
                                .foregroundColor(Color("AccentGreen"))
                        }
                    }
                }
            }
        }
    }
}
