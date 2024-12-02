import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const URL = 'ws://localhost:6969';

export const Room = () => {
    // const socket = new WebSocket(URL);
    const[socket, setSocket] = useState<null | WebSocket>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get('name');
    const [lobby, setLobby] = useState(true);

    useEffect(() => {
        const socket = new WebSocket(URL);
        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.event) {
                case "send-offer":
                    console.log("Send offer event received");
                    // alert("Send offer please");
                    setLobby(false);
                    socket.send(JSON.stringify({
                        event: "offer",
                        roomId: data.roomId,
                        sdp: "" // Placeholder SDP
                    }));
                    break;
                case "offer":
                    // alert("Send answer please");
                    setLobby(false);
                    socket.send(JSON.stringify({
                        event: "answer",
                        roomId: data.roomId,
                        sdp: "" // Placeholder SDP
                    }));
                    break;
                case "answer":
                    setLobby(false);
                    console.log("Connection established");
                    break;
                case "lobby":
                    setLobby(true);
                    break;
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

    if(lobby){
        return <div>
            Waiting for someone to join
        </div>
    }

    return (
        <div>
            Hi {name}
            <video width={400} height={400}/>
            <video width={400} height={400}/>
        </div>
    );
};
