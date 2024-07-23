# Screen shots, Screen/Window recorder, Sound/Voice mod/effects for Linux

Download link: https://github.com/mantzaris/cuttleTron/releases/download/v1.0.0/cuttletron-1.0.0.zip

SHA256: d58207ed0fd002c3eca923e3b9eb5001cc8dd2b5f333b2fa628b04208e81ae95

## Tries to support all versions of GNU/Linux

A button exists so that the user can press it and be prompted for the password to install each dependency separately. The user will be presented with a list of the dependencies in a pop-up dialog beforehand. Testing has been on Ubuntu 20.04 and Ubuntu 24.04 using systems running X11/Wayland and pulseaudio/pipewire but features are expected to work across other distributions too and where expected the specifics of those systems taken into account.

## Screenshots

Works on systems running X11 and Wayland where screens or application windows can be selected for screen shots. Wayland systems do not get a preview but a popup modal for selecting the window/screen, and X11 users can a list in a drop down and a thumbnail preview.

Users can do autocapture where images are created automatically on a user set interval with a numerical increment per image. A gif can be created from the set of images saved from autocapture for the duration of the autocapture.

## Screen Record

Works on systems running X11 and Wayland where screens or application windows can be selected for video recording. Wayland systems do not get a preview but a popup modal for selecting the window/screen, and X11 users can see the list in a drop down and a thumbnail preview. An audio source can be selected as well for the recording and it can come from any audio source or sink available that is listed using the pulseaudio command 'pactl'. There is a dependency for the program 'pulseaudio-utils' be available on the system if the user audio is using pipewire instead of pulseaudio.

Users can pause and continue the video recording.

## Audio Effects

This tool on the UI allows the user to choose an audio source or sink and apply audio effects on it which are then streamed/remaped to a new source called **Cuttletron_Microphone**. These effects make changes to the sound such as changing the pitch, adding echo, etc which the user can select and then regulate the amount of that effect addition. Users can then select this source 'Cuttletron_Microphone' from the list of devices for audio sources in other programs. This new audio source with effects can also then be chosen for the audio source when using the screen record (remember to refresh the list of sources after the creation).

Users can update the effects selected and the parameterizations while the input is being grabbed (eg a user adds echo to the microphone and wants to reduce the echo and add reverb then the update button is pressed for this to be done without stopping and restarting the effect tool).

## Mask Cam

This uses the image feed from your webcam and can produce landmarks over where face marker points are. The user can select whether to only show landmarks, or a basic mask drawing, or both. The original webcam image can also be displayed as well (all 3 or some combination too).

Whether the user is on Wayland or X11 changes things here. If X11, then the user can stream directly to a virtual video device 'cuttleTronMaskCam' which can be used as a source of video. If Wayland, due to permission issues, the user has to use OBS-studio to capture the maskcam video feed and then start the virtual video. When on Wayland the user is provided these instructions on a popup dialog with steps to follow in detail (if you know a work around let me know).
