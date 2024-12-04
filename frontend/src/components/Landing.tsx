import { useEffect, useRef, useState } from 'react';
import { Room } from '../Room';
import './Landing.css'; // Import the CSS file

export const Landing = () => {
    const [name, setName] = useState('');
    const [joined, setJoined] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        const videoTracks = stream.getVideoTracks()[0];
        const audioTracks = stream.getAudioTracks()[0];
        setLocalVideoTrack(videoTracks);
        setLocalAudioTrack(audioTracks);
        if (!videoRef.current) return;
        videoRef.current.srcObject = new MediaStream([videoTracks]);
        videoRef.current.play();
    };

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam();
        }
    }, [videoRef]);

    if (!joined) {
        return (
            <div className="landing-container">
                <video autoPlay ref={videoRef} className="video-background" muted></video>
                <div className="overlay">
                    <h1>Welcome</h1>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="name-input"
                    />
                    <button
                        className="join-button"
                        onClick={() => setJoined(true)}
                    >
                        Join
                    </button>
                </div>
            </div>
        );
    }

    return <Room name={name} localVideoTrack={localVideoTrack} localAudioTrack={localAudioTrack} />;
};
