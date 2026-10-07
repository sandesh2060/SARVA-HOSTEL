import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';
const C=createContext();
export const useAuth=()=>useContext(C);
export function AuthProvider({children}){
  const [state,setState]=useState({loading:true,user:null,hostel:null});
  useEffect(()=>{localStorage.getItem('hostel_token')?api.get('/me').then(({data})=>setState({loading:false,...data})).catch(()=>{localStorage.removeItem('hostel_token');setState({loading:false,user:null,hostel:null})}):setState({loading:false,user:null,hostel:null})},[]);
  const acceptAuth=(data)=>{localStorage.setItem('hostel_token',data.token);setState({loading:false,user:data.user,hostel:data.hostel})};
  const login=async(email,password)=>{const {data}=await api.post('/auth/login',{email,password});acceptAuth(data);return data};
  const googleLogin=async(credential)=>{const {data}=await api.post('/auth/google',{credential});if(data.token)acceptAuth(data);return data};
  const logout=()=>{localStorage.removeItem('hostel_token');location.href='/login'};
  return <C.Provider value={{...state,login,googleLogin,logout}}>{children}</C.Provider>;
}
