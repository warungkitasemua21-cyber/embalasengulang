
import React,{useEffect,useState,useMemo} from "react";
import {createRoot} from "react-dom/client";
import * as XLSX from "xlsx";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";
import "./style.css";

const money=x=>"Rp "+Number(x||0).toLocaleString("id-ID");

function readBook(buf){
 const wb=XLSX.read(buf);
 let obj={};
 wb.SheetNames.forEach(s=>obj[s]=XLSX.utils.sheet_to_json(wb.Sheets[s]));
 return obj;
}

function App(){
 const [book,setBook]=useState({});
 const [agen,setAgen]=useState("");
 const [depo,setDepo]=useState("");
 const [search,setSearch]=useState("");
 const [tab,setTab]=useState("Resume Agen");
 const [history,setHistory]=useState(()=>JSON.parse(localStorage.getItem("embalase_history")||"[]"));
 const [note,setNote]=useState("");

 useEffect(()=>fetch("/default.xlsx").then(r=>r.arrayBuffer()).then(b=>setBook(readBook(b))),[]);

 const upload=e=>{
   let r=new FileReader();
   r.onload=x=>setBook(readBook(x.target.result));
   r.readAsArrayBuffer(e.target.files[0])
 }

 const saveHistory=()=>{
   const h=[...history,{tanggal:new Date().toLocaleString("id-ID"),catatan:note}];
   setHistory(h);localStorage.setItem("embalase_history",JSON.stringify(h));setNote("");
 }

 const resume=book["Resume Agen"]||[];
 const detail=book["Detail"]||[];
 const tahun=book["Piutang Per Tahun"]||[];

 const deps=[...new Set(resume.map(x=>x.Cabang).filter(Boolean))];

 const match=x=>
 (!agen||String(x["Nama Agen"]||"").toLowerCase().includes(agen.toLowerCase())) &&
 (!depo||x.Cabang===depo);

 const filteredResume=resume.filter(match);
 const filteredDetail=detail.filter(x=>
 (!agen||String(x["Nama Agen"]||"").toLowerCase().includes(agen.toLowerCase())) &&
 (!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()))
 );
 const filteredTahun=tahun.filter(x=>!agen||String(x["Nama Agen"]).toLowerCase().includes(agen.toLowerCase()));

 const total=k=>filteredResume.reduce((a,b)=>a+(Number(b[k])||0),0);

 const chart=Object.entries(resume.reduce((a,b)=>{
 let k=b.Cabang||"Tidak Ada";a[k]=(a[k]||0)+(Number(b["Sisa Piutang Embalase (Rp)"])||0);return a
 },{})).map(([name,value])=>({name,value}));

 return <div className="page">
 <header><div className="logo">SBCR</div><div><h1>Dashboard Piutang Embalase</h1><p>Monitoring Piutang Agen Embalase</p></div></header>

 <div className="control">
 <input type="file" accept=".xlsx" onChange={upload}/>
 <input placeholder="Search Agen..." value={agen} onChange={e=>setAgen(e.target.value)}/>
 <input placeholder="Search No Faktur / Detail..." value={search} onChange={e=>setSearch(e.target.value)}/>
 <select onChange={e=>setDepo(e.target.value)}><option value="">Semua Depo</option>{deps.map(x=><option>{x}</option>)}</select>
 </div>

 <div className="cards">
 <Card t="Jumlah Agen" v={filteredResume.length}/>
 <Card t="Surplus Embalase" v={money(total("Surplus Embalase (Rp)"))}/>
 <Card t="Sudah Dibayar" v={money(total("DiBayar Agen (Rp)"))}/>
 <Card t="Sisa Piutang" v={money(total("Sisa Piutang Embalase (Rp)"))}/>
 </div>

 <div className="control">
 <h3>Input Histori Sales</h3>
 <input value={note} placeholder="Masukkan histori follow up agen..." onChange={e=>setNote(e.target.value)}/>
 <button onClick={saveHistory}>Simpan Histori</button>
 {history.map(h=><p>{h.tanggal} - {h.catatan}</p>)}
 </div>

 <nav>{Object.keys(book).map(x=><button onClick={()=>setTab(x)}>{x}</button>)}</nav>

 {tab==="Resume Agen"&&<Table data={filteredResume}/>}
 {tab==="Piutang Per Tahun"&&<Table data={filteredTahun}/>}
 {tab==="Detail"&&<Table data={filteredDetail}/>}

 <div className="box"><h2>Outstanding Embalase per Depo</h2>
 <ResponsiveContainer width="100%" height={300}><BarChart data={chart}><XAxis dataKey="name"/><YAxis/><Tooltip formatter={money}/><Bar dataKey="value"/></BarChart></ResponsiveContainer>
 </div>
 </div>
}

function Card({t,v}){return <div className="card"><span>{t}</span><h2>{v}</h2></div>}
function Table({data}){return <div className="table"><table><thead><tr>{data[0]&&Object.keys(data[0]).map(x=><th>{x}</th>)}</tr></thead><tbody>{data.map((r,i)=><tr key={i}>{Object.values(r).map(v=><td>{v}</td>)}</tr>)}</tbody></table></div>}
createRoot(document.getElementById("root")).render(<App/>);
