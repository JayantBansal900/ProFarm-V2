import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/useAuth';
import type { AuthContextType } from '../src/context/authContextDef';
import { api } from '../src/api/api';
import { bindLanguageUser, selectLanguage } from '../src/i18n';
vi.mock('../src/api/api',()=>({api:{getMe:vi.fn(),login:vi.fn(),register:vi.fn(),logout:vi.fn()}}));
let context: AuthContextType;
function Probe(){context=useAuth();return <p>{context.loading?'loading':context.user?.name||'guest'}</p>;}
const user={id:'race-user',name:'Original user text',email:'race@example.test',createdAt:'2026-01-01T00:00:00Z'};
afterEach(async()=>{cleanup();vi.resetAllMocks();await bindLanguageUser(null);await selectLanguage('en');localStorage.clear();});
describe('authentication language restoration races',()=>{
 it('ignores a stale session response after an explicit login',async()=>{
   let resolveMe!: (value: unknown)=>void;
   vi.mocked(api.getMe).mockReturnValue(new Promise<unknown>(resolve=>{resolveMe=resolve;}) as ReturnType<typeof api.getMe>);
   vi.mocked(api.login).mockResolvedValue({status:'success',user} as Awaited<ReturnType<typeof api.login>>);
   render(<AuthProvider><Probe/></AuthProvider>);
   await act(async()=>context.login({email:user.email,password:'test-password'}));
   expect(screen.getByText(user.name)).toBeInTheDocument();
   await act(async()=>resolveMe(null));
   expect(screen.getByText(user.name)).toBeInTheDocument();
 });
 it('does not retain an infinite loading state after an early failed login',async()=>{
   let resolveMe!: (value: unknown)=>void;
   vi.mocked(api.getMe).mockReturnValue(new Promise<unknown>(resolve=>{resolveMe=resolve;}) as ReturnType<typeof api.getMe>);
   vi.mocked(api.login).mockRejectedValue(new Error('invalid'));
   render(<AuthProvider><Probe/></AuthProvider>);
   await act(async()=>{await expect(context.login({email:user.email,password:'wrong'})).rejects.toThrow('invalid');});
   expect(screen.getByText('guest')).toBeInTheDocument();
   await act(async()=>resolveMe(null));expect(screen.getByText('guest')).toBeInTheDocument();
 });
 it('does not restore an old pending login after logout',async()=>{
   vi.mocked(api.getMe).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof api.getMe>>);
   let resolveLogin!: (value: unknown)=>void;
   vi.mocked(api.login).mockReturnValue(new Promise<unknown>(resolve=>{resolveLogin=resolve;}) as ReturnType<typeof api.login>);
   vi.mocked(api.logout).mockResolvedValue({status:'success',message:'done'});
   render(<AuthProvider><Probe/></AuthProvider>);
   let pending!:Promise<unknown>;
   await act(async()=>{pending=context.login({email:user.email,password:'test-password'});});
   await act(async()=>context.logout());
   await act(async()=>{resolveLogin({status:'success',user});await pending;});
   expect(screen.getByText('guest')).toBeInTheDocument();
 });
});
