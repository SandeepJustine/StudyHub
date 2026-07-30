'use client';

import { useState, useRef, useCallback } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { 
  Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, 
  Monitor, PhoneOff, Users, MessageSquare, Settings,
  Maximize, Minimize, Volume2, VolumeX
} from 'lucide-react';

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  email?: string;
  avatar?: string;
  subject?: string;
  isInstructor?: boolean;
  onEnd?: () => void;
  onLeave?: () => void;
}

interface MeetingState {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  participantCount: number;
  isChatOpen: boolean;
  isFullscreen: boolean;
  isHandRaised: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export function JitsiMeetingComponent({
  roomName,
  displayName,
  email,
  avatar,
  subject = 'Live Class',
  isInstructor = false,
  onEnd,
  onLeave,
}: JitsiMeetingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [meetingState, setMeetingState] = useState<MeetingState>({
    isAudioMuted: false,
    isVideoMuted: true,
    isScreenSharing: false,
    participantCount: 1,
    isChatOpen: false,
    isFullscreen: false,
    isHandRaised: false,
    connectionQuality: 'good',
  });
  
  const jitsiApi = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle API ready
  const handleApiReady = useCallback((api: any) => {
    jitsiApi.current = api;
    setIsLoading(false);
    setToast({ message: 'Connected to meeting', type: 'success' });
    
    // Add event listeners
    api.addListener('audioMuteStatusChanged', ({ muted }: any) => {
      setMeetingState(prev => ({ ...prev, isAudioMuted: muted }));
    });
    
    api.addListener('videoMuteStatusChanged', ({ muted }: any) => {
      setMeetingState(prev => ({ ...prev, isVideoMuted: muted }));
    });
    
    api.addListener('screenSharingStatusChanged', ({ on }: any) => {
      setMeetingState(prev => ({ ...prev, isScreenSharing: on }));
    });
    
    api.addListener('participantJoined', () => {
      setMeetingState(prev => ({ ...prev, participantCount: prev.participantCount + 1 }));
    });
    
    api.addListener('participantLeft', () => {
      setMeetingState(prev => ({ ...prev, participantCount: Math.max(1, prev.participantCount - 1) }));
    });
    
    api.addListener('raiseHandUpdated', ({ handRaised }: any) => {
      setMeetingState(prev => ({ ...prev, isHandRaised: handRaised }));
    });
    
    api.addListener('connectionQualityChanged', ({ quality }: any) => {
      setMeetingState(prev => ({ ...prev, connectionQuality: quality }));
    });

    // Auto-join with muted video
    setTimeout(() => {
      api.executeCommand('toggleVideo');
    }, 1000);
  }, []);

  // Handle meeting end
  const handleReadyToClose = useCallback(() => {
    setIsLoading(true);
    onEnd?.();
  }, [onEnd]);

  // Control functions
  const toggleAudio = () => {
    jitsiApi.current?.executeCommand('toggleAudio');
  };

  const toggleVideo = () => {
    jitsiApi.current?.executeCommand('toggleVideo');
  };

  const toggleScreenShare = () => {
    jitsiApi.current?.executeCommand('toggleShareScreen');
  };

  const toggleChat = () => {
    jitsiApi.current?.executeCommand('toggleChat');
    setMeetingState(prev => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  };

  const toggleRaiseHand = () => {
    jitsiApi.current?.executeCommand('toggleRaiseHand');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setMeetingState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setMeetingState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const hangUp = () => {
    jitsiApi.current?.executeCommand('hangup');
    onLeave?.();
  };

  // Get connection quality indicator
  const getQualityColor = () => {
    switch (meetingState.connectionQuality) {
      case 'excellent': return 'bg-green';
      case 'good': return 'bg-green';
      case 'poor': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red';
      default: return 'bg-green';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Top Info Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getQualityColor()} animate-pulse`} />
            <span className="text-xs text-grey-medium capitalize">{meetingState.connectionQuality}</span>
          </div>
          <span className="text-grey-light">|</span>
          <div className="flex items-center gap-1 text-xs text-grey-medium">
            <Users size={12} />
            <span>{meetingState.participantCount} participants</span>
          </div>
          <span className="text-grey-light">|</span>
          <span className="text-xs text-grey-medium">{subject}</span>
        </div>
        <div className="flex items-center gap-2">
          {isInstructor && (
            <Badge variant="info" size="sm">Instructor</Badge>
          )}
          <Badge variant="success" size="sm">LIVE</Badge>
        </div>
      </div>

      {/* Meeting Area */}
      <div ref={containerRef} className="flex-1 relative bg-black">
        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy z-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green mx-auto mb-4" />
              <p className="text-white text-lg">Joining meeting...</p>
              <p className="text-slate-400 text-sm">{displayName}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy z-20">
            <div className="text-center">
              <p className="text-red-400 mb-3">{error}</p>
              <Button variant="primary" onClick={() => { setError(null); setIsLoading(true); }}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Jitsi Meeting */}
        <JitsiMeeting
          roomName={roomName}
          domain={process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'conference.savingword.org'}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            disableModeratorIndicator: false,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            hideConferenceSubject: false,
            hideConferenceTimer: false,
            doNotStoreRoom: true,
            toolbarButtons: [
              'microphone', 'camera', 'closedcaptions', 'desktop',
              'fullscreen', 'fodeviceselection', 'hangup',
              'profile', 'chat', 'recording', 'livestreaming',
              'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite',
              'feedback', 'stats', 'shortcuts', 'tileview',
              'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security',
            ],
            toolbarConfig: {
              alwaysVisible: true,
            },
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            VIDEO_LAYOUT_FIT: 'both',
            FILM_STRIP_MAX_HEIGHT: 120,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#0D1B3D',
            DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
            DISABLE_FOCUS_INDICATOR: false,
            HIDE_INVITE_MORE_HEADER: false,
            JITSI_WATERMARK_LINK: '',
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'chat', 'raisehand', 'tileview', 'settings',
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: displayName,
            email: email || '',
          }}
          onApiReady={handleApiReady}
          onReadyToClose={handleReadyToClose}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </div>

      {/* Custom Control Bar */}
      <div className="bg-navy text-white px-4 py-3 flex items-center justify-center gap-3 flex-shrink-0">
        {/* Microphone */}
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-xl transition-all ${
            meetingState.isAudioMuted 
              ? 'bg-red/20 text-red hover:bg-red/30' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={meetingState.isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {meetingState.isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Video */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-xl transition-all ${
            meetingState.isVideoMuted 
              ? 'bg-red/20 text-red hover:bg-red/30' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={meetingState.isVideoMuted ? 'Start Video' : 'Stop Video'}
        >
          {meetingState.isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-xl transition-all ${
            meetingState.isScreenSharing 
              ? 'bg-green/20 text-green' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Share Screen"
        >
          <Monitor size={20} />
        </button>

        {/* Chat */}
        <button
          onClick={toggleChat}
          className={`p-3 rounded-xl transition-all ${
            meetingState.isChatOpen 
              ? 'bg-blue-600/20 text-blue-400' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Chat"
        >
          <MessageSquare size={20} />
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleRaiseHand}
          className={`p-3 rounded-xl transition-all ${
            meetingState.isHandRaised 
              ? 'bg-yellow-500/20 text-yellow-400' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Raise Hand"
        >
          ✋
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          title="Fullscreen"
        >
          {meetingState.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        {/* Hang Up */}
        <button
          onClick={hangUp}
          className="p-3 rounded-xl bg-red hover:bg-red-700 transition-all ml-4"
          title="Leave Meeting"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}