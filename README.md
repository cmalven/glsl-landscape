# GLSL Viewer + MIDI Example

## Setup

First, clone this repo with all dependencies:

```
git clone --recursive https://github.com/cmalven/glsl-viewer-midi-example.git
```

Next, you'll need to install the following:

* [glslViewer](https://github.com/patriciogonzalezvivo/glslViewer)
* [MidiGyver](https://github.com/patriciogonzalezvivo/MidiGyver)

## Dev

```shell
glslViewer shader.frag -p 8000
```

then

```shell
midigyver midi.yaml
```
