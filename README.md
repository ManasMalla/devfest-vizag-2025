# DevFest Vizag 2025 Hub

This is the official open-source website for DevFest Vizag 2025, built with Next.js, Tailwind CSS, ShadCN UI, and Firebase.

## Deployed Website

You can view the live site at: **[devfest.vizag.dev](https://devfest.vizag.dev)**

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Firebase account and a new project

### Installation

1.  **Clone the repo**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Set up Firebase Environment Variables**
    Create a file named `.env.local` in the root of your project. You will need to populate it with your Firebase project's configuration keys.

    - **Client SDK Keys:** You can find these in your Firebase project settings under "General".
    - **Admin SDK Keys:** You will need to generate a private key for your service account. In the Firebase console, go to **Project Settings > Service accounts**, and click "Generate new private key".

    Your `.env.local` file should look like this:
    ```env
    # Firebase Client SDK (for the browser)
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...

    # Firebase Admin SDK (for server actions)
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    FIREBASE_CLIENT_EMAIL=...
    ```

4.  **Run the development server**
    ```sh
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to view it in the browser.

## Building for Production

To create an optimized production build, run:
```sh
npm run build
```

To start the production server after building:
```sh
npm run start
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
