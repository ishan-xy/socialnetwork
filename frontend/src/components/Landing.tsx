import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Room } from '../Room';

export const Landing = () => {
    const [name, setName] = useState('');
    const [joined, setJoined] = useState(false);
    const[localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const[localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        const videoTracks = stream.getVideoTracks()[0];
        const audioTracks = stream.getAudioTracks()[0];
        setLocalVideoTrack(videoTracks);
        setLocalAudioTrack(audioTracks);
        if (!videoRef.current) return;
        videoRef.current.srcObject = new MediaStream([videoTracks]);
        videoRef.current.play();
    }

    useEffect(() => {
        if(videoRef && videoRef.current){
            getCam();
        }
    }
    , [videoRef]);

    if(!joined){
        return (
            <div>
                <video autoPlay ref={videoRef}></video>
                <input type="text" onChange={(e) => {
                    setName(e.target.value)
                }}/>
                <button onClick={()=>{
                    setJoined(true)
                }}>Join</button>
            </div>
        )
    }

    return (
        <Room name={name} localVideoTrack={localVideoTrack} localAudioTrack = {localAudioTrack}/>
    )
}