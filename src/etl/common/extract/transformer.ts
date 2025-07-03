import axios from "axios";
// import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

import { Hit } from "../../entities/etl.entity";

// interface ParsedHTML {
//   title: string;
//   content: {
//     h1: string;
//     h2: string;
//     p: string;
//   };
// }

interface ParsedHTML {
  resumen: string;
  id: string;
  fechaElaboracion: string;
  op: string;
  visto: string;
  considerando: string;
  resuelve: string;
  plainText: string;
  wordCounter: number;
}

interface TransformedData {
  metadata: {
    tipoPublicacion: string
    tipoDispositivo: string
    op: string
    resumen: string
    fechaPublicacion: string
    urlPDF: string
  },
  body: ParsedHTML
}

export async function transformData(hits: Hit[]): Promise<TransformedData[]> {
  return await Promise.all(hits.map(hit => transformOne(hit)))
}

export async function transformOne(hit: Hit): Promise<TransformedData> {
  const htmlContent = await extractHTMLContent(`https://busquedas.elperuano.pe/api/visor_html/${hit.op}`);
  const parsedHTML = parseHTML(htmlContent);

  return {
    metadata: {
      tipoPublicacion: hit.tipoPublicacion,
      tipoDispositivo: hit.tipoDispositivo,
      op: hit.op,
      resumen: hit.sumilla,
      fechaPublicacion: hit.fechaPublicacion,
      urlPDF: hit.urlPDF,
    },
    body: parsedHTML
  }
}

// export async function extractHTMLContent(url: string): Promise<any> {
//   // console.log("URL solicitada:", url);

//   const res = await axios.get<string>(url);
//   // console.log(res.data)
//   // return res.data

//   const dom = new JSDOM(res.data);
//   return dom.window.document;
// }

// export function parseHTML(document: Document): ParsedHTML {
//   const title = document.querySelector("title")?.textContent?.trim() || "";

//   const storyDiv = document.querySelector("div.story");
//   if (!storyDiv) {
//     return {
//       title,
//       content: {
//         h1: "",
//         h2: "",
//         p: "",
//       },
//     };
//   }

//   const h1 = Array.from(storyDiv.querySelectorAll("h1"))
//     .map((el) => el.textContent?.trim() || "")
//     .join("\n");

//   const h2 = Array.from(storyDiv.querySelectorAll("h2"))
//     .map((el) => el.textContent?.trim() || "")
//     .join("\n");

//   const p = Array.from(storyDiv.querySelectorAll("p"))
//     .map((el) => el.textContent?.trim() || "")
//     .join("\n");

//   return {
//     title,
//     content: { h1, h2, p },
//   };
// }

export async function extractHTMLContent(url: string): Promise<string> {
  const res = await axios.get<string>(url);
  return res.data;
}

function contarPalabras(texto: string): number {
  const textoNormalizado = texto.replace(/\n/g, ' ');
  const palabras = textoNormalizado.split(' ').filter(palabra => palabra.length > 0);
  return palabras.length;
}

export function parseHTML(html: string) {
  const $ = cheerio.load(html);

  // Limpiar el contenido irrelevante
  $("script, style, noscript, iframe, meta, link").remove();

  const plainText = $("body").text().trim();

  const lines = plainText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const resumen = lines[0] || "";
  const id = lines[3] || "";
  const fechaElaboracion = lines[4] || "";
  const op = lines[lines.length - 1] || "";

  const wordCounter = contarPalabras(plainText);

  // Secciones específicas por expresiones regulares
  // a veces comienza con vista y no trae nada para 2376194-1 y 2376190-1
  const vistoMatch = plainText.split(/VISTO:?|VISTOS:?/i);
  const considerandoMatch = plainText.split(/CONSIDERANDO:/i);
  const resuelveMatch = plainText.split(/RESUELVE:/i);

  const visto = vistoMatch.length > 1 ? vistoMatch[1].split(/CONSIDERANDO:/i)[0].trim() : "";
  const considerando = considerandoMatch.length > 1 ? considerandoMatch[1].split(/RESUELVE:/i)[0].trim() : "";
  const resuelve = resuelveMatch.length > 1 ? resuelveMatch[1].trim() : "";

  return {
    resumen,
    id,
    fechaElaboracion,
    op,
    visto,
    considerando,
    resuelve,
    plainText,
    wordCounter
  };
}