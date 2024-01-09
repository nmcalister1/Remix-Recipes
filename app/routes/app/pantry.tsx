import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import classNames from "classnames";
import React from "react";
import { z } from "zod";
import { DeleteButton, ErrorMessage, PrimaryButton } from "~/components/form";
import { PlusIcon, SaveIcon, SearchIcon, TrashIcon } from "~/components/icons";
import { createShelfItem, deleteShelfItem } from "~/models/pantry-item.server";
import { createShelf, deleteShelf, getAllShelves, saveShelfName } from "~/models/pantry-shelf.server";
import { validateForm } from "~/utils/validation";

export async function loader({ request }: LoaderFunctionArgs){
    const url = new URL(request.url)
    const q = url.searchParams.get("q")
    const shelves =  await getAllShelves(q)
    return json({ shelves })
}



const saveShelfNameSchema = z.object({
    shelfName: z.string().min(1, "Shelf name cannot be blank"),
    shelfId: z.string(),
})

const deleteShelfSchema = z.object({
    shelfId: z.string()
})

const createShelfItemSchema = z.object({
    shelfId: z.string(),
    itemName: z.string().min(1, "Item name cannot be blank")
})

const deleteShelfItemSchema = z.object({
    itemId: z.string()
})

export async function action({ request }: ActionFunctionArgs){
    const formData = await request.formData()
    switch(formData.get("_action")){
        case "createShelf": {
            return createShelf()
        }
        case "deleteShelf": {
            return validateForm(
                formData, 
                deleteShelfSchema,
                (data) => deleteShelf(data.shelfId),
                (errors) => json({ errors }, { status: 400 })
            )
        } 
        case "saveShelfName": {
            return validateForm(
                formData, 
                saveShelfNameSchema,
                (data) => saveShelfName(data.shelfId, data.shelfName),
                (errors) => json({ errors }, { status: 400 })
            )
            
        }
        case "createShelfItem": {
            return validateForm(
                formData, 
                createShelfItemSchema,
                (data) => createShelfItem(data.shelfId, data.itemName),
                (errors) => json({ errors }, { status: 400 })
            )
        }
        case "deleteShelfItem": {
            return validateForm(
                formData, 
                deleteShelfItemSchema,
                (data) => deleteShelfItem(data.itemId),
                (errors) => json({ errors }, { status: 400 })
            )
        }
        default : {
            return null
        }
    }
}

export default function Pantry(){
    const data = useLoaderData<typeof loader>()
    const [searchParams] = useSearchParams()
    const createShelfFetcher = useFetcher()
    const navigation = useNavigation()

    const isSearching = navigation.formData?.has("q")
    const isCreatingShelf = createShelfFetcher.formData?.get("_action") === "createShelf"

    return (
        <div>
            <Form className={classNames("flex border-2 border-gray-300 rounded-md md:w-fit", "focus-within:border-primary", isSearching ? "animate-pulse" : "")}>
                <button className="px-2 mr-1"><SearchIcon /></button>
                <input type="text" defaultValue={searchParams.get("q") ?? ""} autoComplete="off" name="q" placeholder="Search Shelves..." className="w-full py-3 px-2 outline-none"></input>
            </Form>
            <createShelfFetcher.Form method="POST" >
                <PrimaryButton name="_action" value="createShelf" className="mt-4 w-full md:w-fit" isLoading={isCreatingShelf}>
                    <PlusIcon />
                    <span className="pl-2">{isCreatingShelf ? "Creating Shelf..." : "Create Shelf"}</span>
                </PrimaryButton>
            </createShelfFetcher.Form>
            <ul className={classNames("flex gap-8 overflow-x-auto mt-4 pb-4", "snap-x snap-mandatory md:snap-none")}>
                {data.shelves.map((shelf) => 
                    <Shelf key={shelf.id} shelf={shelf} />
                )}
            </ul>
        </div>
    )
}

type ShelfProps = {
    shelf: {
        id: string
        name: string
        items: {
            id: string
            name: string
        }[]
    }
}

function Shelf({ shelf }: ShelfProps){
    const deleteShelfFetcher = useFetcher()
    const saveShelfNameFetcher = useFetcher()
    const createShelfItemFetcher = useFetcher()
    const createItemFormRef = React.useRef<HTMLFormElement>(null)
    const { renderedItems, addItem } = useOptimisticItems(shelf.items)
    const isDeletingShelf = deleteShelfFetcher.formData?.get("_action") === "deleteShelf" && deleteShelfFetcher.formData?.get("shelfId") === shelf.id
    return isDeletingShelf ? null : (
    <li key={shelf.id} className={classNames("border-2 border-primary rounded-md p-4 h-fit", "w-[calc(100vw-2rem)] flex-none snap-center", "md:w-96")}>
        <saveShelfNameFetcher.Form method="POST" className="flex">
            <div className="w-full mb-2">
              <input type="text" defaultValue={shelf.name} name="shelfName" autoComplete="off" placeholder="Shelf Name" className={classNames("text-2xl font-extrabold w-full outline-none", "border-b-2 border-b-background focus:border-b-primary", saveShelfNameFetcher.data?.errors?.shelfName ? "border-b-red-600": "")}></input>
              <ErrorMessage>
                {saveShelfNameFetcher.data?.errors?.shelfName}
            </ErrorMessage>
            </div>
            <button name="_action" value="saveShelfName" className="ml-4"><SaveIcon /></button>
            <input type="hidden" name="shelfId" value={shelf.id} />
            <ErrorMessage className="pl-2">
                {saveShelfNameFetcher.data?.errors?.shelfId}
            </ErrorMessage>
        </saveShelfNameFetcher.Form>

        <createShelfItemFetcher.Form method="POST" ref={createItemFormRef} onSubmit={(e) => {
            const target = e.target as HTMLFormElement
            const itemNameInput = target.elements.namedItem("itemName") as HTMLInputElement
            addItem(itemNameInput.value)
            e.preventDefault()
            createShelfItemFetcher.submit(
                {
                    itemName: itemNameInput.value,
                    shelfId: shelf.id,
                    _action: "createShelfItem"
                },
                { method: "post" }
            )
            createItemFormRef.current?.reset()
        }} className="flex py-2">
            <div className="w-full mb-2">
              <input type="text" name="itemName" autoComplete="off" placeholder="New Item" className={classNames("w-full outline-none", "border-b-2 border-b-background focus:border-b-primary", createShelfItemFetcher.data?.errors?.shelfName ? "border-b-red-600": "")}></input>
              <ErrorMessage>
                {createShelfItemFetcher.data?.errors?.itemName}
            </ErrorMessage>
            </div>
            <button name="_action" value="createShelfItem" className="ml-4"><SaveIcon /></button>
            <input type="hidden" name="shelfId" value={shelf.id} />
            <ErrorMessage className="pl-2">
                {createShelfItemFetcher.data?.errors?.shelfId}
            </ErrorMessage>
        </createShelfItemFetcher.Form>

        <ul>
            {renderedItems.map(item => 
                <ShelfItem key={item.id} shelfItem={item}></ShelfItem>
            )}
        </ul>
        <deleteShelfFetcher.Form method="POST" className="pt-8">
            <input type="hidden" name="shelfId" value={shelf.id} />
            <ErrorMessage className="pb-2">
                {deleteShelfFetcher.data?.errors?.shelfId}
            </ErrorMessage>
            <DeleteButton className="w-full" name="_action" value="deleteShelf" isLoading={isDeletingShelf}>Delete Shelf</DeleteButton>
        </deleteShelfFetcher.Form>
    </li>
    )
}

type ShelfItemProps = {
    id: string
    shelfItem: RenderedItem
}

function ShelfItem({ shelfItem }: ShelfItemProps){
    const deleteShelfItemFetcher = useFetcher()
    return (
        <li className="py-2">
            <deleteShelfItemFetcher.Form method="POST" className="flex">
                <p className="w-full">{shelfItem.name}</p>
                {shelfItem.isOptimistic ? null : (
                    <button name="_action" value="deleteShelfItem"><TrashIcon /></button>

                )}
                <input type="hidden" name="itemId" value={shelfItem.id} />
                <ErrorMessage className="pl-2">
                    {deleteShelfItemFetcher.data?.errors?.itemId}
                </ErrorMessage>
            </deleteShelfItemFetcher.Form>
            
        </li>
    )
}

type RenderedItem = {
    id: string
    name: string
    isOptimistic?: boolean
}

function useOptimisticItems(savedItems: Array<RenderedItem>){
    const [optimisticItems, setOptimisticItems] = React.useState<Array<RenderedItem>>([])

    const renderedItems = [...optimisticItems, ...savedItems]

    renderedItems.sort((a, b) => {
        if (a.name === b.name) return 0
        return a.name < b.name ? -1: 1
    })

    React.useLayoutEffect(() => {
        setOptimisticItems([])
    }, [savedItems])

    const addItem = (name: string) => {
        setOptimisticItems((items) => [...items, { id: createItemId(), name, isOptimistic: true }])
    }

    return { renderedItems, addItem }
}

function createItemId(){
    return `${Math.round(Math.random() * 1_000_000)}`
}