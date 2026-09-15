
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import * as XLSX from "xlsx";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import "./style.css";

const money=v=>"Rp "+Number(v||0).toLocaleString("id-ID");

function App(){
 const [data,setData]=useState([]);
 const [agent,setAgent]=useState("");
 const [depo,setDepo]=useState("");
 const [fact,setFact]=useState("");

 function upload(e){
  const f=e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=x=>{
   const wb=XLSX.read(x.target.result,{type:"binary"});
   setData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
  };
  r.readAsBinaryString(f);
 }

 const rows=data.filter(x=>
 (!agent||x["Nama Agen"]===agent)&&
 (!depo||x["Cabang"]===depo)&&
 (!fact||String(x["Kode Faktur"]||"").includes(fact))
 );

 const total=k=>rows.reduce((a,b)=>a+(Number(b[k])||0),0);

 const depoChart=Object.entries(rows.reduce((a,b)=>{
  let k=b["Cabang"]||"Tidak diketahui";
  a[k]=(a[k]||0)+(Number(b["Sisa Piutang Embalase (Rp)"])||0);
  return a;
 },{})).map(([name,value])=>({name,value}));

 function pdf(){
  const doc=new jsPDF();
  doc.text("PT SBCR - Laporan Piutang Embalase",14,15);
  autoTable(doc,{
   head:[["Agen","Outstanding"]],
   body:rows.slice(0,50).map(x=>[
    x["Nama Agen"],
    money(x["Sisa Piutang Embalase (Rp)"])
   ])
  });
  doc.save("Laporan_Piutang_SBCR.pdf");
 }

 return <main>
 <header>
  <h1>PT SBCR</h1>
  <h2>Dashboard Piutang Embalase Enterprise V4</h2>
 </header>

 <input type="file" accept=".xlsx" onChange={upload}/>
 <button onClick={pdf}>Download PDF</button>

 <div className="filters">
  <select onChange={e=>setAgent(e.target.value)}>
   <option value="">Semua Agen</option>
   {[...new Set(data.map(x=>x["Nama Agen"]))].map(x=><option>{x}</option>)}
  </select>

  <select onChange={e=>setDepo(e.target.value)}>
   <option value="">Semua Depo</option>
   {[...new Set(data.map(x=>x["Cabang"]))].map(x=><option>{x}</option>)}
  </select>

  <input placeholder="Cari Faktur" onChange={e=>setFact(e.target.value)}/>
 </div>

 <section>
 <Card t="Agen" v={rows.length}/>
 <Card t="Surplus" v={money(total("Surplus Embalase (Rp)"))}/>
 <Card t="Dibayar" v={money(total("DiBayar Agen (Rp)"))}/>
 <Card t="Outstanding" v={money(total("Sisa Piutang Embalase (Rp)"))}/>
 </section>

 <div className="box">
 <h2>Overview Piutang Per Depo</h2>
 <ResponsiveContainer height={350}>
 <BarChart data={depoChart}>
 <XAxis dataKey="name"/><YAxis/><Tooltip formatter={money}/>
 <Bar dataKey="value"/>
 </BarChart>
 </ResponsiveContainer>
 </div>

 <table>
 <thead><tr>
 <th>Agen</th><th>Depo</th><th>Outstanding</th>
 </tr></thead>
 <tbody>
 {rows.map((x,i)=>
 <tr key={i}>
 <td>{x["Nama Agen"]}</td>
 <td>{x["Cabang"]}</td>
 <td>{money(x["Sisa Piutang Embalase (Rp)"])}</td>
 </tr>)}
 </tbody>
 </table>
 </main>
}

function Card({t,v}){return <div className="card"><small>{t}</small><h2>{v}</h2></div>}

createRoot(document.getElementById("root")).render(<App/>);
