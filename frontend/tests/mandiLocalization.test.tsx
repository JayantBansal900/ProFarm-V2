import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MandiPage } from '../src/pages/MandiPage';
import { api } from '../src/api/api';
import { languages } from '../src/i18n/languages';
import { bindLanguageUser, selectLanguage } from '../src/i18n';
import catalogs from '../src/i18n/locales/catalogs.json';
vi.mock('../src/api/api',async importOriginal=>{
 const original=await importOriginal<typeof import('../src/api/api')>();
 return {...original,api:{...original.api,getMandiFilters:vi.fn(),getMandiPrices:vi.fn()}};
});
afterEach(async()=>{cleanup();vi.clearAllMocks();await bindLanguageUser(null);await selectLanguage('en');localStorage.clear();});
describe('Mandi canonical API identities in every language',()=>{
 it.each(languages)('$code translates labels while keeping query values canonical',async({code})=>{
   await selectLanguage(code);
   vi.mocked(api.getMandiFilters).mockResolvedValue({status:'success',commodities:['Wheat','Maize'],states:[{state:'Rajasthan',districts:['Jaipur']}],dataFreshness:{fetchedAt:'2026-10-28T00:00:00Z',cached:false}});
   vi.mocked(api.getMandiPrices).mockResolvedValue({status:'success',records:[],pagination:{page:1,limit:20,totalRecords:0,totalPages:1},filters:{commodity:'Wheat',state:null,district:null,market:null},sorting:'modal_price_desc',attribution:{source:'AGMARKNET',datasetTitle:'daily',resourceId:'public',url:'https://data.gov.in',disclaimer:'source'},dataFreshness:{fetchedAt:'2026-10-28T00:00:00Z',cached:false}});
   render(<BrowserRouter><MandiPage/></BrowserRouter>);
   const stateOption=await screen.findByRole('option',{name:catalogs[code].Rajasthan});
   expect(stateOption).toHaveValue('Rajasthan');
   const state=screen.getByRole('combobox',{name:catalogs[code].State});
   fireEvent.change(state,{target:{value:'Rajasthan'}});
   await waitFor(()=>expect(api.getMandiPrices).toHaveBeenLastCalledWith(expect.objectContaining({commodity:'Wheat',state:'Rajasthan'}),expect.anything()));
   const district=screen.getByRole('combobox',{name:catalogs[code].District});
   expect(screen.getByRole('option',{name:catalogs[code].Jaipur})).toHaveValue('Jaipur');
   fireEvent.change(district,{target:{value:'Jaipur'}});
   await waitFor(()=>expect(api.getMandiPrices).toHaveBeenLastCalledWith(expect.objectContaining({state:'Rajasthan',district:'Jaipur'}),expect.anything()));
   fireEvent.click(screen.getByRole('button',{name:catalogs[code].Maize}));
   await waitFor(()=>expect(api.getMandiPrices).toHaveBeenLastCalledWith(expect.objectContaining({commodity:'Maize',state:'Rajasthan',district:'Jaipur'}),expect.anything()));
 });
});
