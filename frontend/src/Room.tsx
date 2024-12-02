import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const URL = "ws://localhost:6969";

export const Room = ({
  name,
  localVideoTrack,
  localAudioTrack,
}: {
  name: string;
  localVideoTrack: MediaStreamTrack | null;
  localAudioTrack: MediaStreamTrack | null;
}) => {
  const [socket, setSocket] = useState<null | WebSocket>(null);
  const [searchParams] = useSearchParams();
  const [lobby, setLobby] = useState(true);
  const [sendingPC, setSendingPC] = useState<RTCPeerConnection | null>(null);
  const [receivingPC, setReceivingPC] = useState<RTCPeerConnection | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(URL);
    setSocket(socket);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "send-offer": {
          setLobby(false);
          const pc = new RTCPeerConnection();
          setSendingPC(pc);

          if (localVideoTrack) {
            console.error("Added track");
            console.log(localVideoTrack);
            pc.addTrack(localVideoTrack);
          }
          if (localAudioTrack) {
            console.error("Added track");
            console.log(localAudioTrack);
            pc.addTrack(localAudioTrack);
          }

          pc.onicecandidate = async (e) => {
            console.log("Receiving ICE candidate locally");
            if (e.candidate) {
              socket.send(
                JSON.stringify({
                  event: "add-ice-candidate",
                  candidate: e.candidate,
                  roomId: data.roomId,
                  type: "sender",
                })
              );
            }
          };

          pc.onnegotiationneeded = async () => {
            console.log("On negotiation needed, sending offer");
            const sdp = await pc.createOffer();
            pc.setLocalDescription(sdp);
            socket.send(
              JSON.stringify({
                event: "offer",
                roomId: data.roomId,
                sdp: sdp.sdp,
              })
            );
          };
          break;
        }

        case "offer": {
          console.log("Received offer");
          setLobby(false);

          const pc = new RTCPeerConnection();
          await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
          const sdp = await pc.createAnswer();
          await pc.setLocalDescription(sdp);
          const stream = new MediaStream();

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }

          setRemoteMediaStream(stream);
          setReceivingPC(pc);
          pc.ontrack = (e) => {
            console.log("On track event triggered");
          };
          pc.onicecandidate = async (e) => {
            if (!e.candidate) {
              return;
            }
            console.log("Receiving ICE candidate");
            socket.send(
              JSON.stringify({
                event: "add-ice-candidate",
                candidate: e.candidate,
                roomId: data.roomId,
                type: "receiver",
              })
            );
          };

          socket.send(
            JSON.stringify({
              event: "answer",
              roomId: data.roomId,
              sdp: sdp.sdp,
            })
          );

          setTimeout(() => {
            const [track1, track2] = pc.getTransceivers().map((t) => t.receiver.track);
            console.log(track1);

            if (track1.kind === "video") {
              setRemoteAudioTrack(track2);
              setRemoteVideoTrack(track1);
            } else {
              setRemoteAudioTrack(track1);
              setRemoteVideoTrack(track2);
            }

            if (remoteVideoRef.current?.srcObject) {
              const currentStream = remoteVideoRef.current.srcObject as MediaStream;
              currentStream.addTrack(track1);
              currentStream.addTrack(track2);
              remoteVideoRef.current?.play();
            }
          }, 5000);

          break;
        }

        case "answer": {
          setLobby(false);
          setSendingPC((pc) => {
            pc?.setRemoteDescription({ type: "answer", sdp: data.sdp });
            return pc;
          });
          console.log("Loop closed");
          break;
        }

        case "lobby": {
          setLobby(true);
          break;
        }

        case "add-ice-candidate": {
          console.log("Add ICE candidate from remote");
          console.log({ candidate: data.candidate, type: data.type });
          if (data.type === "sender") {
            setReceivingPC((pc) => {
              pc?.addIceCandidate(data.candidate);
              return pc;
            });
          } else {
            setSendingPC((pc) => {
              pc?.addIceCandidate(data.candidate);
              return pc;
            });
          }
          break;
        }
        default:
          console.warn("Unknown event:", data.event);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [name]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
        localVideoRef.current.play();
      }
    }
  }, [localVideoTrack]);

  return (
    <div>
      Hi {name}
      <video autoPlay width={400} height={400} ref={localVideoRef} />
      {lobby ? "Waiting to connect you to someone" : null}
      <video autoPlay width={400} height={400} ref={remoteVideoRef} />
    </div>
  );
};
