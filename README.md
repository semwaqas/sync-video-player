# Synchronized Video Component Documentation

![newgif-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/e7fa3178-196d-4c74-b97f-c71842ac5cfa)



## Overview
The `SynchronizedVideo` component is a React component that allows side-by-side video comparison with synchronized playback, custom controls, and advanced caching mechanisms.

## Features
- Side-by-side video comparison using `ReactCompareSlider`
- Synchronized video playback
- Custom video controls
- Video caching mechanism
- Extensive customization options
- Responsive design
- Error handling

## Installation Requirements
- React
- Next.js
- `react-compare-slider`
- `lucide-react`

## Props Interface
```typescript
interface SynchronizedVideoProps {
  src1: string;                     // First video source URL
  src2: string;                     // Second video source URL
  type: string;                     // Video type
  width?: string;                   // Video width
  height?: string;                  // Video height
  className1?: string;              // CSS class for first video
  className2?: string;              // CSS class for second video
  isPause?: boolean;                // Initial pause state
  isMute?: boolean;                 // Initial mute state
  fallbackSrc?: string;             // Fallback video source
  label1Text?: string;              // Label for first video
  label2Text?: string;              // Label for second video
  
  // Styling Props
  textStyleLabel1?: string;
  textStyleLabel2?: string;
  progressBarBackgroundColor?: string;
  progressBarFilledColor?: string;
  controlBarBackgroundColor?: string;
  controlButtonColor?: string;
  controlButtonHoverColor?: string;
  timeTextColor?: string;
  volumeSliderThumbColor?: string;
  controlbarwidth?: string;
}
```

## Key Features Breakdown

### 1. Video Caching
- Implements a sophisticated video caching mechanism
- Uses `Map` to store video URLs and reference counts
- Prevents unnecessary network requests
- Automatically releases cached resources when no longer needed

### 2. Video Synchronization
- Ensures both videos remain in sync
- Handles play/pause states across both videos
- Manages video playback during tab visibility changes

### 3. Custom Controls
- Play/Pause button
- Progress bar with seek functionality
- Volume control
- Mute/Unmute toggle
- Time display

### 4. Error Handling
- Graceful error display if video loading fails
- Fallback video support

## Usage Example
```typescript
<SynchronizedVideo 
  src1="/path/to/video1.mp4"
  src2="/path/to/video2.mp4"
  type="video/mp4"
  width="500px"
  height="300px"
  isPause={false}
  label1Text="Before"
  label2Text="After"
  controlBarBackgroundColor="bg-gray-800"
  progressBarFilledColor="bg-blue-500"
/>
```

## Performance Considerations
- Uses `useRef` for efficient DOM manipulation
- Implements cleanup mechanisms in `useEffect`
- Caches video URLs to reduce network requests
- Handles tab visibility to optimize resource usage

## Customization
The component offers extensive customization through props:
- Video dimensions
- Playback state
- Control styling
- Label styling
- Color schemes

## Browser Compatibility
- Requires modern browsers supporting `URL.createObjectURL()`
- Works best with Next.js React applications

## Potential Improvements
- Add keyboard navigation support
- Implement fullscreen mode
- Add playback speed controls
- Enhance error handling

## Dependencies
- React
- Next.js Image component
- react-compare-slider
- lucide-react icons

## Accessibility Considerations
- Provides alternative fallback video
- Uses semantic HTML5 video elements
- Supports muting and volume control

## TypeScript Support
Full TypeScript support with comprehensive prop typing.
