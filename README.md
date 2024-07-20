# Screen shots, Screen/Window recorder, Sound/Voice mod/effects for Linux


## Tries to support all versions of GNU/Linux

A button exists so that the user can press it and be prompted for the password to install each dependency separately. The user will be presented with a list of the dependencies in a pop-up dialog beforehand. 

## Screenshots

Works on systems running X11 and Wayland where screens or application windows can be selected for screen shots. Wayland systems do not get a preview but a popup modal for selecting the window/screen, and X11 users can a list in a drop down and a thumbnail preview. 

Users can do autocapture where images are created automatically on a user set interval with a numerical increment per image. A gif can be created from the set of images saved from autocapture for the duration of the autocapture. 

## Screen Record

Works on systems running X11 and Wayland where screens or application windows can be selected for video recording. Wayland systems do not get a preview but a popup modal for selecting the window/screen, and X11 users can see the list in a drop down and a thumbnail preview. An audio source can be selected as well for the recording and it can come from any audio source or sink available that is listed using the pulseaudio command 'pactl'. There is a dependency for the program 'pulseaudio-utils' be available on the system if the user audio is using pipewire instead of pulseaudio.

Users can pause and continue the video recording.

## TBC



1. Take screen shots of screens or application windows
2. Take videos that are saved to .webm format of either screens or specific application windows. The audio from the user choice is save along with it if chosen. The audio source does not need to originate from the overall system source or the same application producing the window (eg record video from your web browser and audio from an audio player like VLC).
3. Sound effects/mods, choose the source (eg the microphone or an application) and then select the effects like pitch shift or echo. This creates a new source of audio that can be used for applications like Skype or even in the screen record above after it is streaming.

### Requirements

Not all of the 'components' require these dependencies.

-  ffmpeg version >=4.2 (for audio recording with the screen record)
- "gstreamer1.0-tools", "gstreamer1.0-plugins-base", "gstreamer1.0-plugins-good", "gstreamer1.0-plugins-bad", "gstreamer1.0-plugins-ugly" (for the audio effects and modifications)

  

