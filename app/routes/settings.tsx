import { Link, Outlet } from "@remix-run/react";

export default function Settings(){

    return (
        <div>
            <h1>Settings Route</h1>
            <nav>
                <Link to="app">App</Link>
                <Link to="profile">Profile</Link>
            </nav>
            <Outlet />
        </div>
    )
}