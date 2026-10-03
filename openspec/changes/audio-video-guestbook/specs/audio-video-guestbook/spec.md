# Spec Delta

## Purpose
Obsługa nagrywania, przesyłania i przechowywania krótkich wiadomości wideo i audio od gości w formie "życzeń", z zachowaniem wydajności na małych serwerach.

## ADDED Requirements

### Requirement: Guest can record and upload audio or video message
The system SHALL allow unauthenticated guests to select an "Audio/Video Message" option, record directly in the browser, and upload it. The system MUST enforce a maximum duration limit (e.g., 60 seconds) on the client side.

#### Scenario: Successful video upload
- **WHEN** a guest clicks "Record Video", records a 30-second message, and submits
- **THEN** the system uploads the video file and associates it with the gallery as a guestbook message

#### Scenario: Successful audio upload
- **WHEN** a guest clicks "Record Audio", records a message, and submits
- **THEN** the system uploads the audio file and associates it with the gallery as a guestbook message

### Requirement: System limits processing concurrency for media
The system MUST transcode or extract thumbnails from uploaded audio/video files strictly within the existing `p-queue` with `concurrency: 2`. The system MUST enforce a hard 25-second `SIGKILL` watchdog for any child processes (e.g. FFmpeg) handling these files.

#### Scenario: Concurrent video uploads
- **WHEN** 5 guests upload videos simultaneously
- **THEN** the system processes at most 2 files at a time and places the rest in the queue

#### Scenario: FFmpeg hangs during processing
- **WHEN** a malformed video causes FFmpeg to hang for more than 25 seconds
- **THEN** the system sends a SIGKILL to the process, marks the upload as failed, and frees the queue slot

### Requirement: Gallery displays audio and video messages
The system SHALL display uploaded audio and video messages in the live gallery. The Lightbox modal MUST support playback of these formats without breaking touch swipe gestures.

#### Scenario: Viewing a video message
- **WHEN** a user opens a video message in the gallery Lightbox
- **THEN** the video is playable and the user can swipe to the next media item

### Requirement: ZIP export separates guestbook messages
The system SHALL stream ZIP exports such that audio files are placed in an `audio/` directory and video files in a `video/` directory.

#### Scenario: Downloading full gallery archive
- **WHEN** an owner or guest requests a ZIP archive of the gallery
- **THEN** the streamed ZIP contains the messages under the correct subdirectories, never buffering the entire archive in RAM
