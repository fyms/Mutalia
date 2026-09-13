"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/agenda/AppointmentForm";
export function HouseholdAppointment({householdId,name}:{householdId:string;name:string}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[message,setMessage]=useState("");const router=useRouter();
 const close=()=>{dialog.current?.close();setOpen(false);trigger.current?.focus();};
 return <><button ref={trigger} className="m-button m-button--secondary text-sm" onClick={()=>{setOpen(true);setMessage("");dialog.current?.showModal();}}>Planifier un rendez-vous</button>
 <dialog style={{margin:"auto"}} ref={dialog} aria-label={`Rendez-vous · ${name}`} className="m-panel m-auto w-[calc(100%_-_2rem)] max-w-3xl max-h-[90vh] overflow-auto" onCancel={()=>setOpen(false)}>
 {open&&<AppointmentForm householdId={householdId} households={[{id:householdId,name}]} lockHousehold onCancel={close} onDone={()=>{close();setMessage("Rendez-vous enregistré.");router.refresh();}}/>}</dialog>
 {message&&<span role="status" className="m-help">{message}</span>}</>;
}
