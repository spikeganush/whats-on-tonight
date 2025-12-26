# Project Status: What's on tonight

## 🚀 What are we doing?
We are building a **collaborative movie discovery app** using **React Native (Expo)**.
The goal is to solve the "doom scrolling" problem by allowing groups of friends to swipe on movies and find a match in real-time.

**Stack:**
-   **Frontend**: Expo, NativeWind (Tailwind), Reanimated, Gesture Handler.
-   **Backend**: Convex (Self-Hosted) for real-time sync.
-   **Data**: TMDB API for movies/TV shows and streaming providers.

## 📍 Where are we?
We have successfully completed the **Core Foundation** and **Backend Integration**.

### ✅ Completed
1.  **Project Setup**: TypeScript, NativeWind, Directory structure.
2.  **UI/UX**: 
    -   Home Screen.
    -   Room Configuration (Genres, Country, Providers).
    -   Swipe Interface (Tinder-like cards).
3.  **Backend (Convex)**:
    -   Real-time Room creation and joining.
    -   User presence tracking.
    -   Swipe recording and Match detection logic.
4.  **Refinement**:
    -   **Auto-Country Detection** via `expo-localization`.
    -   **Streaming Provider Selection** (Netflix, Prime, etc.) specific to the user's region.

### 🚧  Current State
The app is **functional**.
-   You can create a room.
-   Friends can join via code.
-   The host can configure filters (Movies/TV, Genre, Service).
-   Everyone can swipe, and likes are synced to the backend.

## 🔮 What is needed next?
To make this a complete, shippable product, we need to focus on:

1.  **Match UI Experience**: 
    -   Currently, when a match is found, we just show simple text ("It's a Match!").
    -   *Needed*: A beautiful "Match Found" modal/screen showing the movie details and where to watch it. (Work in progress: Results Screen for Full Deck mode)
2.  **Error Handling & Edge Cases**:
    -   Handle network disconnects gracefully.
    -   Handle "No more movies" scenarios better (pagination - ✅ Implemented).
3.  **Authentication/Persistance**:
    -   ✅ Added persistence for user swipes (don't show seen movies).
    -   ✅ Added "Super Like" feature.
    -   ✅ Added Room Config options (Deck Size, Game Mode).
    -   ✅ Added "Full Deck" mode with Results Screen.
    -   ✅ Added Room Cleanup (auto-delete empty rooms).
4.  **Polishing**:
    -   Add transitions between screens.
    -   Add haptic feedback on swipes.
