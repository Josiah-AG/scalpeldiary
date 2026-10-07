import { Component, ReactNode, useEffect, useState } from 'react';
export function NetworkStatus() {
 const [offline,setOffline]=useState(!navigator.onLine);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 return offline ? <div role="alert" className="bg-amber-100 text-amber-900 p-3 text-center">You’re offline. Reconnect before saving changes; offline submissions are not queued.</div> : null;
}
export class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? <main role="alert" className="p-8 text-center"><h1>Unable to load this page</h1><p>Your saved records are unchanged. Reload to try again.</p><button className="mt-4 rounded bg-blue-600 text-white px-4 py-2" onClick={()=>location.reload()}>Reload</button></main> : this.props.children;}
}
