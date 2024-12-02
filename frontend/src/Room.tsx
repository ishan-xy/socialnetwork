import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"

export const Room = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get('name');

    useEffect(() => {
        console.log(name);
        //logic to join room
    }, [name]);

    return (
        <div>
            Hi {name}
        </div>
    )
}