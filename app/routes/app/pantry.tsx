import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import classNames from "classnames";
import { DeleteButton, PrimaryButton } from "~/components/form";
import { PlusIcon, SearchIcon } from "~/components/icons";
import { createShelf, getAllShelves } from "~/models/pantry-shelf.server";

export async function loader({ request }: LoaderFunctionArgs){
    const url = new URL(request.url)
    const q = url.searchParams.get("q")
    const shelves =  await getAllShelves(q)
    return json({ shelves })
}

export async function action(){
    return createShelf()
}

export default function Pantry(){
    const data = useLoaderData<typeof loader>()
    const [searchParams] = useSearchParams()
    const navigation = useNavigation()

    const isSearching = navigation.formData?.has("q")
    const isCreatingShelf = navigation.formData?.has("createShelf")

    return (
        <div>
            <Form className={classNames("flex border-2 border-gray-300 rounded-md md:w-fit", "focus-within:border-primary", isSearching ? "animate-pulse" : "")}>
                <button className="px-2 mr-1"><SearchIcon /></button>
                <input type="text" defaultValue={searchParams.get("q") ?? ""} autoComplete="off" name="q" placeholder="Search Shelves..." className="w-full py-3 px-2 outline-none"></input>
            </Form>
            <Form method="POST" >
                <PrimaryButton name="createShelf" className={classNames("mt-4 w-full md:w-fit", isCreatingShelf ? "bg-primary-light" : "")}>
                    <PlusIcon />
                    <span className="pl-2">{isCreatingShelf ? "Creating Shelf..." : "Create Shelf"}</span>
                </PrimaryButton>
            </Form>
            <ul className={classNames("flex gap-8 overflow-x-auto mt-4 pb-4", "snap-x snap-mandatory md:snap-none")}>
                {data.shelves.map((shelf) => (
                    <li key={shelf.id} className={classNames("border-2 border-primary rounded-md p-4 h-fit", "w-[calc(100vw-2rem)] flex-none snap-center", "md:w-96")}>
                        <h1 className="text-2xl font-extrabold mb-2">{shelf.name}</h1>
                        <ul>
                            {shelf.items.map(item => 
                                <li key={item.id} className="py-2">{item.name}</li>
                            )}
                        </ul>
                        <Form method="POST" className="pt-8">
                                <DeleteButton className="w-full" name="deleteShelf">Delete Shelf</DeleteButton>
                        </Form>
                    </li>
                ))}
            </ul>
        </div>
    )
}