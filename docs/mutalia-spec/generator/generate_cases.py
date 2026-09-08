#!/usr/bin/env python3
"""Mutalia synthetic training case generator.

Creates clearly fictional PDF training documents + case.json + answer_key.json.
Requires: reportlab
Usage:
    python generate_cases.py --count 20 --seed 42 --out ./generated_cases
"""
from pathlib import Path
import argparse, random, json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import mm

SCENARIOS=[
    "consultation_specialiste","orthodontie_enfant","optique_conjoint","hospitalisation",
    "audiologie","reclamation","piece_manquante","doublon","mauvais_beneficiaire",
    "droits_fermes","rib_invalide","plafond_a_controler"
]
F=["Nadia","Sophie","Élodie","Aïcha","Camille","Julie","Fatou","Claire","Lina","Sarah",
   "Thomas","Karim","Julien","Marc","David","Mehdi","Lucas","Nicolas","Yann","Hugo"]
L=["Benali","Martin","Durand","Morel","Diallo","Petit","Lefèvre","Robert","Garnier","Mercier","Roux","Fontaine"]
styles=getSampleStyleSheet()
warn=ParagraphStyle("warn",parent=styles["BodyText"],fontSize=8.5,textColor=colors.HexColor("#7A1F1F"))

def dump(p,o): p.write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding="utf-8")
def money(v): return f"{v:.2f} €".replace(".",",")

def make_pdf(path,title,rows):
    doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=15*mm,leftMargin=15*mm,topMargin=15*mm,bottomMargin=15*mm)
    story=[Paragraph("DOCUMENT FICTIF - FORMATION MUTALIA - SANS VALEUR",warn),Spacer(1,5*mm),Paragraph(title,styles["Title"]),Spacer(1,5*mm)]
    t=Table(rows,colWidths=[55*mm,115*mm])
    t.setStyle(TableStyle([
        ("GRID",(0,0),(-1,-1),0.4,colors.grey),("BACKGROUND",(0,0),(0,-1),colors.HexColor("#EFEFEF")),
        ("VALIGN",(0,0),(-1,-1),"TOP"),("FONTSIZE",(0,0),(-1,-1),9)
    ]))
    story += [t,Spacer(1,8*mm),Paragraph("Document synthétique Mutalia sans valeur administrative, médicale ou bancaire.",styles["BodyText"])]
    doc.build(story)

def main():
    p=argparse.ArgumentParser(); p.add_argument("--count",type=int,default=10); p.add_argument("--seed",type=int,default=42); p.add_argument("--out",default="./generated_cases")
    a=p.parse_args(); r=random.Random(a.seed); out=Path(a.out); out.mkdir(parents=True,exist_ok=True); idx=[]
    for i in range(1,a.count+1):
        cid=f"CASE-GEN-{i:04d}"; d=out/cid; d.mkdir(exist_ok=True)
        scenario=r.choice(SCENARIOS); role=r.choice(["adherent","conjoint","enfant"])
        member={"member_id":f"MUT-DEMO-{i:04d}","first_name":r.choice(F),"last_name":r.choice(L),"role":role,"synthetic":True}
        amount=r.choice([55,70,85,120,280,390,780,1200,1650])
        anomaly=r.choice(["aucune","piece_manquante","doublon","mauvais_beneficiaire","date_incoherente","plafond_a_controler"])
        pdf_name="document_01.pdf"
        make_pdf(d/pdf_name,f"Pièce d'exercice - {scenario}",[
            ["Dossier",cid],["Bénéficiaire",f"{member['first_name']} {member['last_name']}"],
            ["Rôle",role],["Montant",money(amount)],["Anomalie injectée",anomaly]
        ])
        case={"case_id":cid,"scenario_type":scenario,"beneficiary":member,"amount":amount,"documents":[pdf_name],"synthetic":True}
        key={"case_id":cid,"expected_anomaly":anomaly,"expected_focus":scenario,"rule":"Utiliser le référentiel 2026 ; ne jamais inventer une garantie manquante."}
        dump(d/"case.json",case); dump(d/"answer_key.json",key); idx.append({"case_id":cid,"scenario_type":scenario,"anomaly":anomaly})
    dump(out/"index.json",{"seed":a.seed,"cases":idx})
    print(f"Generated {len(idx)} cases in {out}")
if __name__=="__main__": main()
