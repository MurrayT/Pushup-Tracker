import {useAuth} from "../lib/authContext.ts";
import {Navigate} from "react-router";

export default function PrivateRoute({children}: React.PropsWithChildren) {
    const {user} = useAuth()
    return user ? children : <Navigate to="/login" replace/>
}
