import React from 'react';
export default class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return{error}}
  componentDidCatch(error,info){console.error('SARVA Hostel UI error',error,info)}
  render(){if(!this.state.error)return this.props.children;return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><h1 className="text-xl font-bold text-slate-900">This page could not be displayed</h1><p className="mt-2 text-sm text-slate-600">{this.state.error?.message||'Unexpected frontend error.'}</p><button className="mt-5 bg-slate-950 text-white" onClick={()=>window.location.reload()}>Reload page</button></div></div>}
}
