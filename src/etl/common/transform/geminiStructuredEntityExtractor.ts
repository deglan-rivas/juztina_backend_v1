import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash-lite-preview-06-17';

export async function geminiStructuredEntityExtractor(document: {
    id: string;
    fechaElaboracion: string;
    resumen: string;
    visto: string;
    considerando: string;
    resuelve: string;
    plainText: string;
  }): Promise<any> {
    //  Por último, no consideres el último nombre de la persona que se encuentra al final del documento que suele estar acompañado del cargo "Presidenta" o "Presidente" pues generalmente se refiere a la persona que firma la resolución y no es relevante para el contexto de la resolución.
    // TODO hacerlo con 30 resoluciones de la forma pasada e ir refinando el prompt - revisar el .txt para las resoluciones citadas, agregar fallbacks
    // TODO separar la presidenta como peronsa que firma o autoriza, una persona puede tener más de un cargo a veces no tenog eje,po xd agregar el id de la resolución en cuestión y no agregarlo como norma juridica citada
    // TODO reprocesar el batch actual y ver por qué a veces hay más cargos que personas xd todo el resto lo extrae bien
    // TODO agregar el enlace a norma jurídica actual si es Resolución Administrativa, si es otro tipo de norma jurídica no agregar el enlace o construirlo de otra forma o agregar el NL de la metadata xd -> mejor ponerlo como código cuando tenga la metadata de mongoDB
    const prompt = `Eres un extractor estructurado de entidades jurídicas. A partir del siguiente texto, extrae las entidades clave en formato JSON con 
    estas categorías. Además, ten en cuenta estas consideraciones:
    - el campo "aprobado_por" se refiere a la persona que aprueba la resolución, se encuentra al final del documento y suele tener el cargo de "Presidente" o "Presidenta". El formato del campo "nombre" debe ser Capitalized, es decir, si se encuentra el nombre "JANET TELLO GILARD", entonces debe guardarse como "Janet Tello Gilard"
    - el campo "personas_involucradas" se refiere a nombres de personas naturales con su cargo o título el cual generalmente se presenta inmediatamente después o antes del nombre como se muestra en estos ejemplos: "Ariel Antonio Quispe Laureano, Juez Especializado Penal del Distrito Judicial de Puno", "Anny Reyes Laurel, Secretaria Técnica de la Comisión de Justicia de Género del Poder Judicial", "María Isabel Chipana Gamarra, Secretaria General del Consejo Ejecutivo del Poder Judicial". Considera que no siempre incluyen el cargo de la persona en el contenido. Algunos cargos tienen contenido entre paréntesis como "Presidente (e)" o "Juez Especializado Penal (Unipersonal)", pero no es necesario incluir el contenido entre paréntesis. El formato del campo "nombre" debe ser Capitalized, es decir, si se encuentra el nombre "JANET TELLO GILARD", entonces debe guardarse como "Janet Tello Gilard". Este campo no debe incluir a la persona que aprueba la resolución la cual se encuentra al final del documento en los últimos 5 párrafos, pues para eso está el campo "aprobado_por"
    - el campo "provincias" se refiere a las provincias o departamentos del Perú como "Lima", "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali", "Callao". Si no se especifica ninguna provincia, no incluyas el campo "provincias" en el JSON.
    - el campo "instituciones" se refiere a instituciones mencionadas el texto como "Poder Judicial", "Autoridad Nacional de Control del Poder Judicial", "Ministerio Público", "Defensoría del Pueblo", "Oficina de Control de la Magistratura", "Jurado Nacional de Elecciones", "Registro Nacional de Identificación y Estado Civil", "Superintendencia Nacional de Migraciones". No incluyas siglas como RENIEC, JNE, ONPE, etc. sino el nombre completo de la institución.
    - el campo "fecha_elaboracion" se refiere a la fecha de elaboración del documento, que generalmente se encuentra en la parte superior del texto y debes devolverla en el formato ISO 8601 (YYYY-MM-DD)
    - el campo "norma_juridica_actual" se refiere a la norma jurídica actual del documento, que generalmente se encuentra en las primeras 5 líneas debajo del título resumen y encima de la fecha de elaboración. El campo "id" debe contener el identificador de la norma jurídica y el campo "tipo" debe contener el tipo de norma jurídica como "Resolución Administrativa", "Decreto Supremo", etc. 
    - el campo "normas_juridicas_citadas" hace referencia a todas las normas jurídicas citadas en el texto, por ejemplo: "Resolución", "Resolución Administrativa", "Ley", "Decreto Supremo", "Decreto Legislativo", "Acuerdo", "Oficio", "Memorando", etc. Los "Artículos", "Incisos", entre otros no son normas jurídicas sino que son parte de ellas. Considera que su campo "tipo" siempre debe estar en Capitalized en ese sentido el tipo debe ser "Oficio" y no "oficio". Además, algunas veces hay separaciones propias de la redacción del texto, por ejemplo: el "id" con valor "000033-N-2025-GG-PJ" también puede encontrarse como "000033-N-2025  -GG-PJ" o "000033-N-2025- GG-PJ", por lo que no los consideres como normas jurídicas distintas. En algunas ocasiones usan siglas para referirse a las normas jurídicas, por ejemplo: "RA" para "Resolución Administrativa", "D.S." para "Decreto Supremo", "D.L." para "Decreto Legislativo", etc, estas siglas por lo general se entienden por el contexto y debes guardarlas con el valor extenso como "Decreto Supremo" y no como "D.S.". Este campo tampoco debe incluir a la norma jurídica actual del documento, que se encuentra en las primeras 5 líneas debajo del título resumen y encima de la fecha de elaboración, pues para eso está el campo "norma_juridica_actual".
    Este es un ejemplo de cómo debe ser el JSON de salida:
  
  {
    "aprobado_por": {
      "nombre": "Janet Tello Gilardi", "cargo": "Presidente"
    },
    "personas_involucradas": [
      {"nombre": "Ariel Antonio Quispe Laureano", "cargo": "Juez Especializado Penal del Distrito Judicial de Puno"},
      {"nombre": "Anny Reyes Laurel", "cargo": "Secretaria Técnica de la Comisión de Justicia de Género del Poder Judicial"},
      {"nombre": "María Isabel Chipana Gamarra", "cargo": "Secretaria General del Consejo Ejecutivo del Poder Judicial"},
      {"nombre": "Carlos Alberto Ramos López", "cargo": ""}
    ],
    "instituciones": [
      "Consejo Ejecutivo del Poder Judicial",
      "Comisión de Justicia de Género del Poder Judicial",
      "Poder Judicial",
      "Consejo General del Poder Judicial de España",
      "Agencia Española de Cooperación Internacional para el Desarrollo",
      "Centro de Investigaciones Judiciales",
      "Corte Superior"
    ],
    "provincias": ["Puno", "Lima", "Callao"],
    "fecha_elaboracion": "2025-01-15",
    "norma_juridica_actual": {
      "id": "000167-2025-CE-PJ", "tipo": "Resolución Administrativa"
    },
    "normas_juridicas_citadas": [
      {"id": "000155-2025-CE-PJ", "tipo": "Resolución Administrativa"},
      {"id": "000034-2025-CR-UETI-CPP-PJ", "tipo": "Oficio"},
      { id: "27619", tipo: "Ley" }
    ]
  }
  
  En tu respuesta evita agregar los backticks \`\`\`json al inicio y los backticks \`\`\` al final del JSON. pues tu respuesta se usará en la función JSON.parse() de typescript y si incluyes los backticks, romperás todo mi flujo de procesamiento.
  
  Texto: """
  ${document.plainText}
  """`;
  
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });
  
    let text = response.text?.trim() ?? '{}';
    if (text.startsWith('```json') || text.startsWith('```')) {
      text = text.replace(/^```json\s*|```$/g, '').trim();
    }
  //   const text = response.text.trim();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('❌ Error al parsear JSON de Gemini:', err);
      console.log('Texto crudo de Gemini:', text);
      return null;
    }
  }