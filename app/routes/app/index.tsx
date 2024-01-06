import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export function loader({request} : LoaderFunctionArgs){
    return redirect("/app/pantry")
}