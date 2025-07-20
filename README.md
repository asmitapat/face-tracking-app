# Face Tracking Application

A responsive face tracking web application built with Next.js, face-api.js, and Tailwind CSS. The app allows users to record videos with a live face tracking marker overlay, save recordings locally (with audio), and works seamlessly on both desktop and mobile devices.

## Features
- 🎥 **Face Tracking**: Real-time face detection using open-source [face-api.js](https://github.com/justadudewhohacks/face-api.js).
- 🔴 **Video Recording**: Record video with face marker overlay and audio using the MediaRecorder API.
- 💾 **Local Storage**: Save and manage recordings locally in the browser (using IndexedDB for large files).
- 📱 **Responsive Design**: Fully responsive UI for desktop and mobile, styled with Tailwind CSS.
- 🗑️ **Manage Recordings**: View, play, and delete saved videos.

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn

### Installation
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Run the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

### Model Files
- Face-api.js models are stored in `public/models/`. These are required for face detection to work. If you deploy elsewhere, ensure these files are included.

## Usage
1. Allow camera and microphone access when prompted.
2. Position your face in the frame. The app will highlight your face with a marker.
3. Click **Start Recording** to record video (with marker and audio).
4. Click **Stop Recording** to finish and save the video.
5. View, play, or delete your saved videos in the **Saved Videos** section.

## Technical Details
- **Framework:** Next.js
- **Face Tracking:** face-api.js
- **Recording:** MediaRecorder API, canvas compositing for marker overlay
- **Storage:** IndexedDB (for large video/audio blobs)
- **Styling:** Tailwind CSS

## Notes
- For best results, use a modern browser (Chrome, Firefox, Safari).
- On mobile, the camera frame is optimized for face coverage and smooth recording.
- All processing is done locally; no video or face data is uploaded.

## License
This project is open-source and available under the MIT License. 