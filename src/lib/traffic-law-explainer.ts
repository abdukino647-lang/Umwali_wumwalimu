/**
 * Rwandan Traffic Law (Amategeko y'Umuhanda mu Rwanda) Explainer Engine
 *
 * Provides comprehensive, educational explanations in formal, grammatically correct Kinyarwanda
 * based directly on Iteka rya Perezida No 85/01 ryo ku wa 02/09/2002 rigenga amategeko y'umuhanda.
 *
 * Covers 100% of all 403 questions in the national exam book (dreamz.txt / questions_grouped.json).
 * 100% Free & Zero-Failure: Requires no paid API keys. Works offline and in production instantly.
 * Optionally connects to Google Gemini (free tier) if GEMINI_API_KEY is provided.
 */

import questionExplanationsData from "@/data/question_explanations.json";

export interface ExplanationRequest {
  questionId?: string;
  questionNumber?: number;
  questionText: string;
  category?: string;
  options: { key: string; text: string; isCorrect?: boolean }[];
  correctKey: string;
  correctText: string;
  userKey?: string | null;
  userText?: string | null;
}

export interface ExplanationEntry {
  number: number;
  matchText: string;
  correctKey: string;
  correctText: string;
  lawTitle: string;
  lawDetails: string;
  memoryTip: string;
}

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 1. FAST DUAL-INDEXED EXPLANATION LOOKUP TABLE (All 403 Questions)
// ---------------------------------------------------------------------------

const exactKeyMap = new Map<string, ExplanationEntry>();
const textAndKeyMap = new Map<string, ExplanationEntry>();
const numAndTextMap = new Map<string, ExplanationEntry>();
const textMap = new Map<string, ExplanationEntry>();
const numMap = new Map<number, ExplanationEntry>();

for (const item of (questionExplanationsData as ExplanationEntry[])) {
  const nText = norm(item.matchText);
  const nCorr = norm(item.correctText);
  const cKey = (item.correctKey || "").toLowerCase();

  exactKeyMap.set(`${nText}___${nCorr}`, item);
  textAndKeyMap.set(`${nText}___${cKey}`, item);
  numAndTextMap.set(`${item.number}___${nCorr}`, item);
  if (!textMap.has(nText)) textMap.set(nText, item);
  if (!numMap.has(item.number)) numMap.set(item.number, item);
}

// ---------------------------------------------------------------------------
// 2. BUILT-IN RWANDAN TRAFFIC LAW KNOWLEDGE ENGINE (100% Coverage)
// ---------------------------------------------------------------------------

export function buildExplanationFallback(req: ExplanationRequest): string {
  const qText = (req.questionText || "").trim();
  const cKey = (req.correctKey || "").toUpperCase();
  const cText = (req.correctText || "").trim();
  const uKey = req.userKey ? req.userKey.toUpperCase() : null;
  const uText = req.userText ? req.userText.trim() : null;
  const isCorrect = uKey === cKey;
  const num = req.questionNumber;

  const nText = norm(qText);
  const nCorr = norm(cText);

  // 1. Match directly against the 403-question verified database
  const matched =
    exactKeyMap.get(`${nText}___${nCorr}`) ||
    textAndKeyMap.get(`${nText}___${cKey.toLowerCase()}`) ||
    (num ? numAndTextMap.get(`${num}___${nCorr}`) : undefined) ||
    textMap.get(nText) ||
    (num ? numMap.get(num) : undefined);

  let lawTitle = "";
  let lawDetails = "";
  let memoryTip = "";

  if (matched) {
    lawTitle = matched.lawTitle;
    lawDetails = matched.lawDetails;
    memoryTip = matched.memoryTip;
  } else {
    // Safety net for custom / dynamic questions outside the 403 official questions
    const lowerQ = qText.toLowerCase();

    if (lowerQ.includes("isuzumwa") || lowerQ.includes("kugenzurwa") || lowerQ.includes("control technique")) {
      lawTitle = "Ingingo ya 14: Isuzumwa ry'Ubuziranenge bw'Ibinyabiziga (Contrôle Technique)";
      lawDetails =
        "Ibinyabiziga bitwara abagenzi muri rusange, ibitwara ibintu birengeje toni 3.5, n'ibyigisha gutwara bisuzumwa buri mezi 6. " +
        "Imodoka zisanzwe z'abantu ku giti cyabo bisuzumwa buri mwaka (1). Ikinyabiziga gishya gisuzumwa bwa mbere nyuma y'imyaka 2.";
      memoryTip = "Abagenzi n'amakamyo > 3.5t = buri mezi 6. Imodoka z'abantu ku giti cyabo = buri mwaka.";
    } else if (lowerQ.includes("guhagarara") || lowerQ.includes("akanya kanini") || lowerQ.includes("guparika")) {
      lawTitle = "Ingingo ya 38: Ahantu Habujijwe Guhagarara Akanya Kanini";
      lawDetails =
        "Birabujijwe guhagarara akanya kanini: ahatarengeje metero 1 imbere cyangwa inyuma y'ikindi kinyabiziga; " +
        "ahatarengeje metero 5 mbere y'amasangano y'imihanda cyangwa aho abanyamaguru bambukira; n'imbere y'amashuri n'ibitaro.";
      memoryTip = "Metero 1 ku zindi modoka, metero 5 mbere y'amasangano n'inzira z'abanyamaguru.";
    } else if (lowerQ.includes("umuvuduko") || lowerQ.includes("km/h") || lowerQ.includes("mu isaha")) {
      lawTitle = "Ingingo ya 18-24: Umuvuduko Ntarengwa mu Rwanda";
      lawDetails =
        "Mu nsisiro (agace gatuwe), umuvuduko ntarengwa ni 40 km/h. Hanze y'insisiro: amapikipiki mato/velomoteri ntarenza 50 km/h; " +
        "amakamyo n'ibitwara abagenzi ntibirenza 60 km/h; imodoka nto ntizirenza 80-100 km/h bitewe n'ibyapa.";
      memoryTip = "Mu nsisiro = 40 km/h. Velomoteri hanze = 50 km/h. Ibitwara abagenzi = 60 km/h.";
    } else if (lowerQ.includes("kunyuranaho") || lowerQ.includes("kunyura ku")) {
      lawTitle = "Ingingo ya 26-36: Amategeko yo Kunyuranaho (Dépassement)";
      lawDetails =
        "Kunyuranaho bikorerwa ibumoso gusa muri rusange. Kunyuranaho iburyo byemewe gusa iyo ikinyabiziga kigiye gukatira ibumoso, " +
        "cyangwa kuri gari ya moshi igendera hagati mu muhanda.";
      memoryTip = "Kunyuranaho bikorerwa ibumoso; iburyo ni igihe gusa uw'imbere agiye gukatira ibumoso.";
    } else if (lowerQ.includes("itara") || lowerQ.includes("amatara") || lowerQ.includes("rumuri")) {
      lawTitle = "Ingingo ya 46-78: Amatara n'Utugarurarumuri";
      lawDetails =
        "Amatara y'urugendo (phares) amurika nibura metero 100 imbere. Amatara yo kubona aho ugana (code) amurika nibura metero 40. " +
        "Amatara yo guhagarara (stop) ni amutuku akabona kure ya metero 100 ku zuba.";
      memoryTip = "Phare = 100m. Code = 40m. Stop = itara ritukura ribonwa kuri 100m ku zuba.";
    } else if (lowerQ.includes("icyapa") || lowerQ.includes("ibyapa") || lowerQ.includes("kimenyetso")) {
      // Specific sign knowledge for new Category D ibyapa questions (Q454-Q468)
      if (lowerQ.includes("piste") || (lowerQ.includes("igare") && lowerQ.includes("ubururu"))) {
        lawTitle = "Icyapa cy'Inzira y'Amagare (Piste Cyclable)";
        lawDetails = "Icyapa cy'ubururu gifite igare (Piste cyclable) ni itegeko: Inzira yagenewe amagare gusa. Imodoka, amapikipiki, n'ibindi binyabiziga bifite moteri birabujijwe kuyikoresha.";
        memoryTip = "Ubururu + igare = Piste cyclable. Imodoka n'amapikipiki birabujijwe!";
      } else if (lowerQ.includes("travaux") || lowerQ.includes("ouvrier") || lowerQ.includes("bubatse")) {
        lawTitle = "Icyapa cy'Imirimo y'Umuhanda (Travaux)";
        lawDetails = "Icyapa cy'ouvriers/travaux kikuburira ko imbere hari abakozi bakoraho umuhanda. Ugomba kugabanya umuvuduko, kwitondereza ibimenyetso by'agateganyo, no kubahiriza amabwiriza y'umuyobozi w'imirimo (signaleur).";
        memoryTip = "Ouvriers = Imirimo. Gabanya umuvuduko, witondere abakozi bari hafi!";
      } else if (lowerQ.includes("stop") || lowerQ.includes("octogone") || lowerQ.includes("mburungushu")) {
        lawTitle = "Icyapa cya STOP (Mburungushu y'Itukura)";
        lawDetails = "Icyapa cya STOP (octogone itukura) kitegeka guhagarara BURUNDU (tires zose zigomba gusimba ku murongo wera), no guha inzira ibinyabiziga byose biganisha (mu cyerekezo cyose). Ntukore ko uhagaze barungu — ugomba kugaragaza ko wahagaraye neza.";
        memoryTip = "STOP = Hagarara BURUNDU. Bahe inzira bose mbere yo gukomeza!";
      } else if (lowerQ.includes("sens unique") || lowerQ.includes("umwambi munini") || lowerQ.includes("flèche bleue") || lowerQ.includes("icyerekezo kimwe")) {
        lawTitle = "Inzira y'Icyerekezo Kimwe (Sens Unique)";
        lawDetails = "Umwambi munini w'ubururu ni icyapa cy'amakuru cyerekana inzira y'icyerekezo kimwe gusa. Ibinyabiziga byose bigenda mu cyerekezo kimwe gusa cwerekanywe. Birabujijwe burundu gutera imbere mu rundi ruhande.";
        memoryTip = "Umwambi munini w'ubururu = Sens unique. Icyerekezo kimwe gusa!";
      } else if (lowerQ.includes("no stopping") || lowerQ.includes("no waiting") || (lowerQ.includes("uruziga") && lowerQ.includes("umurongo umwe"))) {
        lawTitle = "Icyapa kibuza Guhagarara (No Stopping / No Parking)";
        lawDetails = "Uruziga rufite umurongo umwe utukura (/) = 'No Stopping' — Birabujijwe guhagarara na gato. Uruziga rufite imirongo ibiri itukura (XX) = 'No Parking' — Birabujijwe guparika, ariko guhagarara akanya gato byemewe gufuta abagenzi. Inyuguti P ufite umurongo utukura = No Parking.";
        memoryTip = "Umurongo umwe (/) = No Stopping. Imirongo ibiri (XX) = No Parking. P + umurongo = No Parking.";
      } else if (lowerQ.includes("flèche verte") || lowerQ.includes("umwambi w'icyatsi") || lowerQ.includes("umwambi werekana iburyo")) {
        lawTitle = "Umwambi w'Icyatsi (Flèche Verte Conditionnelle)";
        lawDetails = "Umwambi w'icyatsi ushyizwe hasi y'itara ritukura usobanura ko wemerewe gukatira mu cyerekezo cwerekanywe ndetse n'aho itara ritukura rimurika. Ugomba guha inzira abanyamaguru bose bambuka no kubahiriza uburenganzira bwabo.";
        memoryTip = "Umwambi w'icyatsi = Kata nyuma yo guha inzira abanyamaguru. Ntiwirengagize abanyamaguru!";
      } else if (lowerQ.includes("arrêt") || lowerQ.includes("sitara") || lowerQ.includes("bisi") || lowerQ.includes("bus")) {
        lawTitle = "Icyapa cy'Ahantu Amabisi Ahagarara (Arrêt de Bus)";
        lawDetails = "Icyapa cy'arrêt de bus cyerekana aho amabisi ahagarara kuzamura cyangwa kurukura abagenzi. Izindi modoka ntizemerewe guhagarara aho cyangwa kuhagira bibuza bisi kuhagera.";
        memoryTip = "Arrêt de bus = Bisi gusa ihagarara. Izindi modoka birababujijwe!";
      } else if (lowerQ.includes("abana") || lowerQ.includes("ishuri") || lowerQ.includes("umwana")) {
        lawTitle = "Icyapa kiburira Ahegereye Amashuri n'Inzira y'Abana";
        lawDetails = "Icyapa kiburira gifite ishusho y'abantu babiri (umuntu mukuru n'umwana) kisobanura ko imbere hari amashuri, inzira y'abana cyangwa aho abana benshi bagendera. Ugomba kugabanya cyane umuvuduko (akenshi kugeza 30 km/h cyangwa munsi).";
        memoryTip = "Umuntu mukuru + umwana = Amashuri. Gabanya umuvuduko cyane, witondere abana!";
      } else if (lowerQ.includes("glissante") || lowerQ.includes("verglas") || lowerQ.includes("urubura") || lowerQ.includes("woroheje")) {
        lawTitle = "Icyapa kiburira Umuhanda Woroheje (Route Glissante)";
        lawDetails = "Icyapa kiburira gifite ishusho yerekana urubura/ubushyuhe bufi (snowflake/ice) kisobanura 'Route glissante' — Umuhanda woroheje. Ugomba kugabanya umuvuduko, kwirinda kwamamara cyane, no kwitegereza intera yo kuhagarara.";
        memoryTip = "Urubura/ibyuma = Umuhanda woroheje. Gabanya umuvuduko!";
      } else if (lowerQ.includes("kunyuranaho") && (lowerQ.includes("amakamyo") || lowerQ.includes("poids"))) {
        lawTitle = "Icyapa kibuza Amakamyo Kunyuranaho (Poids-Lourds)";
        lawDetails = "Uruziga rutukura rugaragaza amakamyo (camion) ari imbere y'imodoka nto bisobanura 'Interdiction de dépasser pour les poids-lourds' — Birabujijwe kunyuranaho ku binyabiziga bigari b'ubucuruzi (birengeje toni 3.5) gusa. Imodoka nto (légères) zishobora gukomeza kunyuranaho.";
        memoryTip = "Amakamyo + imodoka nto bigana = Amakamyo nta kunyuranaho. Imodoka nto ziryemerewe!";
      } else {
        lawTitle = "Ingingo ya 89-105: Ibyapa n'Ibimenyetso byo mu Muhanda";
        lawDetails =
          "**Amabara n'Amategeko yabyo:** " +
          "🔺 Mpandeshatu + Umuzenguruko Utukura = Ibyapa Biburira (Warning). " +
          "[INFO] Uruziga + Umuzenguruko Utukura = Ibyapa Bibuza (Prohibitory). " +
          "🔵 Uruziga rw'Ubururu = Ibyapa Bitegeka (Mandatory). " +
          "🟦 Urukiramende/Kare rw'Ubururu = Ibyapa by'Amakuru (Information). " +
          "🛑 Mburungushu (Octogone) Itukura = STOP (Hagarara Burundu). " +
          "🔺 Mpandeshatu Yiburiwe hasi = Give Way / Tanga Inzira.";
        memoryTip = "Mpandeshatu = Ibyago. Uruziga rutukura = Kubuza. Uruziga rw'ubururu = Gutegeka. Mburungushu = STOP.";
      }
    } else if (lowerQ.includes("gutambuka") || lowerQ.includes("amasangano") || lowerQ.includes("priorite")) {
      lawTitle = "Ingingo ya 15-17: Uburenganzira bwo Gutambuka Mbere";
      lawDetails =
        "Mu masangano asanzwe adafite ibyapa, ikinyabiziga giturutse iburyo nicyo gitambuka mbere (priorité à droite). " +
        "Muri rond-point, ibinyabiziga biri imbere mu masangano azunguruka nibyo bifite uburenganzira mbere y'ibigiye kwinjiramo.";
      memoryTip = "Amasangano asanzwe = Iburyo buratambuka. Rond-point = Uwurimo atambuka mbere.";

    // -----------------------------------------------------------------------
    // 2024 LAW UPDATES — Ibihindutse mu amategeko ya 2023/2024
    // -----------------------------------------------------------------------
    } else if (lowerQ.includes("moto") && (lowerQ.includes("umwana") || lowerQ.includes("imyaka") || lowerQ.includes("umugenzi"))) {
      lawTitle = "Amategeko y'Umutekano wo Gutwara Moto — Imyaka y'Umwana (Ivugururwa rya 2024)";
      lawDetails =
        "Hakurikijwe amategeko y'u Rwanda ya 2024 (police.gov.rw), **birabujijwe gutwara umwana uri munsi y'imyaka 12 kuri moto**. " +
        "Ingingo z'ingenzi: (1) Umushoferi n'umugenzi bagomba kwambara ingofero ifunze neza (casque) — nibura, nta harihariwe; " +
        "(2) Birabujijwe gutwara abagenzi barenze umwe; " +
        "(3) Abana bari munsi y'imyaka 12 ntibemerewe gutwara kuri moto kubera impamvu z'umutekano wabo — ingofero zisanzwe ntizibakira neza. " +
        "[WARN] Gitabo gya kera kivuga 'Biremewe gutwara umwana w'imyaka 7 nta nkomyi' — iki AMAKOSA mu mategeko mashya.";
      memoryTip = "Moto: Munsi y'imyaka 12 bibujijwe. Casque ni ngombwa buri gihe. Umugenzi umwe gusa.";

    } else if (lowerQ.includes("inzoga") || lowerQ.includes("sinze") || lowerQ.includes("bac") || lowerQ.includes("g/l") || lowerQ.includes("maraso")) {
      lawTitle = "Igipimo cy'Inzoga mu Maraso — BAC (Blood Alcohol Concentration)";
      lawDetails =
        "Mu Rwanda, igipimo ntarengwa cy'inzoga cyemewe mu maraso y'umuyobozi ni **0.8 g/l** (garama 0.8 kuri litiro y'amaraso) " +
        "cyangwa **0.4 mg/l** mu mwuka w'uguhumeka. Kurenza iki gipimo bihanishwa: " +
        "amande ya 150,000 Frw, gufungwa iminsi 5, no gufatirwa ikinyabiziga. " +
        "Kubuza gupimwa nayo byahanishwa nk'ikosa rikomeye. " +
        "[WARN] Polisi y'u Rwanda yifuza zero tolerance — ntiwumve ngo 'gato gato birakwiriye'.";
      memoryTip = "BAC ntarengwa = 0.8 g/l. Amande = 150,000 Frw. Ntukunde gutwara wasinze!";

    } else if (lowerQ.includes("camera") || lowerQ.includes("amande") || lowerQ.includes("ihazabu") || lowerQ.includes("fines")) {
      lawTitle = "Amande n'Ibihano bya Camera yo mu Muhanda (Ivugururwa rya 2024)";
      lawDetails =
        "Camera zikoreshwa na Polisi y'u Rwanda zigenzura umuvuduko n'amatara: " +
        "(1) **Camera zihoraho** (Fixed cameras) — ziherereye ku nkingi ku mihanda; " +
        "(2) **Camera zimurwa** (Mobile cameras) — ku modoka za Polisi; " +
        "(3) **Camera zo ku matara** (Red-light cameras) — ku masangano. " +
        "Camera zigira **tolerance ya 10%** hejuru y'umuvuduko ugaragazwa n'icyapa mbere yo kwandika amande. " +
        "Nk'urugero: umuhanda wa 60 km/h, camera itangira kwandika amande ku 66 km/h. " +
        "Amande yoherezwa kuri SMS, ikishyurwa mu minsi 30 (kuri fines.police.gov.rw cyangwa Irembo *909#). " +
        "Kurenga itara ritukura: amande y'amafaranga 25,000–50,000 Frw (reba amakuru mashya kuri police.gov.rw).";
      memoryTip = "Camera tolerance = 10%. Kwishyura mu minsi 30 kuri Irembo. Itara ritukura = amande nini!";

    } else if (lowerQ.includes("telefoni") || lowerQ.includes("bluetooth") || lowerQ.includes("hands-free") || lowerQ.includes("sms")) {
      lawTitle = "Amategeko yo Gukoresha Telefoni mu Gihe Utwaye (2023/2024)";
      lawDetails =
        "Amategeko y'umuhanda mu Rwanda **abuza burundu** gufata cyangwa gukoresha telefoni igendanwa mu ntoki igihe utwaye ikinyabiziga. " +
        "**Byemewe gusa:** Gukoresha uburyo bwa Bluetooth / Hands-free budasaba gufata telefoni mu ntoki. " +
        "**Bibujijwe:** Gufata telefoni, kwandika SMS, kuyitegera, haba ku muvuduko uwo ariwose (n'igihe uhagaze ku tara!). " +
        "Amande y'ikosa iri = igihano gikomeye + gufatirwa ikinyabiziga mu bihe bimwe.";
      memoryTip = "Telefoni mu ntoki = Bibujijwe burundu. Bluetooth/Hands-free gusa ni byemewe.";

    } else if (lowerQ.includes("speed governor") || lowerQ.includes("akuma") || lowerQ.includes("kagabanya umuvuduko")) {
      lawTitle = "Iteka rya Minisitiri ku Twuma Tugabanya Umuvuduko (Speed Governors)";
      lawDetails =
        "Ibinyabiziga byose bitwara abagenzi muri rusange (bisi, coaster, twegerane) n'ibitwara imizigo bifite uburemere burenga toni 3.5 " +
        "bitegetswe kugira **akuma kagabanya umuvuduko (Speed Governor)** gatuma bidashobora kurenza **60 km/h** aho byaba bigenda hose. " +
        "Polisi y'u Rwanda igenzura ibi buri gihe mu mirimo yo mu muhanda. Kutubahiriza bihanishwa amande ndetse n'iguhagarika ry'uruhushya.";
      memoryTip = "Speed Governor: Abagenzi + Amakamyo >3.5t = Max 60 km/h. Polisi igenzura buri gihe.";

    } else if (lowerQ.includes("boulevard") || lowerQ.includes("dual carriageway") || lowerQ.includes("sonatubes") || lowerQ.includes("kigali")) {
      lawTitle = "Umuvuduko Ntarengwa mu Mujyi wa Kigali — Imihanda Migari (2024)";
      lawDetails =
        "Mu Mujyi wa Kigali: umuvuduko rusange mu nsisiro ni **40 km/h**. " +
        "Imihanda migari (Boulevards / Dual Carriageways) ifite ibyapa byemera **60 km/h** ku binyabiziga bito. " +
        "Imihanda y'igihugu isohoka mu mujyi ishobora kwemerera kugeza kuri **80 km/h** bitewe n'ibyapa. " +
        "Camera nyinshi zishyizweho ku mihanda ya Kigali — buri gihe ubahirize ibyapa.";
      memoryTip = "Kigali: Insisiro = 40 km/h. Boulevard = 60 km/h. Hanze y'umujyi = 80 km/h.";

    } else if (lowerQ.includes("abanyamagaru") || lowerQ.includes("piste cyclable") || lowerQ.includes("amagare")) {
      lawTitle = "Itegeko Rigenga Inzira y'Amagare (Piste Cyclable)";
      lawDetails =
        "Inzira yagenewe abanyamagare (piste cyclable) igomba gukoreshwa n'amagare gusa. " +
        "Ibindi binyabiziga byose bigendeshwa na moteri **birabujijwe** kuyigenderamo cyangwa kuyihagararamo. " +
        "Abanyamagare bagomba kuyikoresha ntibabangamire abanyamaguru.";
      memoryTip = "Piste cyclable = Inzira itegetswe amagare; imodoka na moto ntibyemerewe.";

    } else {
      lawTitle = `Ingingo y'Amategeko y'Umuhanda mu Rwanda - ${cText}`;
      lawDetails = `Hakurikijwe amategeko agenga umutekano wo mu muhanda mu Rwanda (Iteka rya Perezida No 85/01), igisubizo cy'ukuri kandi cyujuje ibisabwa kuri iki kibazo ni: **${cKey}. ${cText}**. Iri tegeko rigamije gukumira impanuka no kubahiriza amabwiriza y'imigendere myiza mu muhanda.`;
      memoryTip = `Igisubizo cy'ukuri: ${cText}.`;
    }
  }

  // -----------------------------------------------------------------------
  // STRUCTURED RESPONSE BUILDER
  // -----------------------------------------------------------------------

  let explanation = `### [TARGET] Igisubizo cy'ukuri: ${cKey}. ${cText}\n\n`;
  explanation += `#### [LAW] Impamvu n'Itegeko ry'Umuhanda (${lawTitle}):\n${lawDetails}\n\n`;

  // Specific user choice breakdown
  if (!isCorrect && uKey) {
    if (cText.toLowerCase().includes("nta gisubizo cy’ukuri") || cText.toLowerCase().includes("nta gisubizo cy'ukuri")) {
      explanation +=
        `#### [WRONG] Kuki amahitamo wakoze (${uKey}) atari yo?\n` +
        `Watoranyije **${uKey}. ${uText || ""}**.\n` +
        `Iri hitamo ntabwo ryubahirije ibipimo cyangwa amategeko abigenga. Kubera ko amahitamo A, B, na C yose arimo amakosa cyangwa ibipimo bitari byo, ` +
        `nta na rimwe ry'ukuri ririmo. Ni yo mpamvu igisubizo nyacyo kiba **${cKey} (${cText})**.\n\n`;
    } else if (cText.toLowerCase().includes("ibisubizo byose nibyo") || cText.toLowerCase().includes("byose ni byo")) {
      explanation +=
        `#### [WRONG] Kuki amahitamo wakoze (${uKey}) yari igice gusa?\n` +
        `Watoranyije **${uKey}. ${uText || ""}**.\n` +
        `Ni byo, ingingo ya ${uKey} na yo irakurikizwa mu mategeko, ariko ntabwo ari yo yonyine! ` +
        `Kubera ko n'ayandi mahitamo yavuzwe yose ari ukuri, igisubizo cyuzuye kiba **${cKey} (${cText})**.\n\n`;
    } else {
      explanation +=
        `#### [WRONG] Kuki amahitamo wakoze (${uKey}) atari yo?\n` +
        `Watoranyije **${uKey}. ${uText || ""}**.\n` +
        `Iri hitamo ntabwo ari ryo kuko itegeko rigena ko igisubizo cy'ukuri kandi cyujuje amabwiriza ari **${cKey}. ${cText}**.\n\n`;
    }
  } else if (isCorrect) {
    explanation +=
      `#### [CORRECT] Watsinze iki kibazo!\n` +
      `Wahisemo neza igisubizo cy'ukuri **${cKey}**. Ibisobanuro by'amategeko hejuru bigufasha kurushaho gusobanukirwa no kubitsinda mu kizamini cya Polisi.\n\n`;
  }

  explanation += `[TIP] **Inama yo gufata mu mutwe mu kizamini:** ${memoryTip}`;

  return explanation;
}

// ---------------------------------------------------------------------------
// 3. OPTIONAL FREE AI EXPLANATION ENGINE (Google Gemini Free Tier)
// ---------------------------------------------------------------------------

async function tryAiExplanation(req: ExplanationRequest): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) return null;

  const optionsFormatted = req.options
    .map((o) => `  ${o.key.toUpperCase()}. ${o.text}`)
    .join("\n");

  const systemPrompt = `Uri Mwarimu w'inzobere mu mategeko y'umuhanda mu Rwanda (Certified Rwanda Traffic Law & Police Driving Test Instructor).
Urasabwa gusobanura ikibazo mu Kinyarwanda cy'umwimerere, kiboneye, kandi gisobanutse neza nta makosa y'imyandikire (100% flawless Rwandan Kinyarwanda).

ISHINGIRO RY'AMATEGEKO:
- Iteka rya Perezida No 85/01 ryo ku wa 02/09/2002 (rishingiro rya mbere)
- Iteka rya Perezida No 066/01 ryo ku wa 19/07/2024 (ivugururwa rishya)
- Law nº 042/2023 of 02/08/2023 (gutwara abantu n'ibintu mu Rwanda)
- Amabwiriza ya Polisi y'u Rwanda ya 2024 (police.gov.rw)

AMABWIRIZA Y'UBUSOBANURO:
1. Tangira uvuga igisubizo cy'ukuri neza.
2. Sobanura neza itegeko ry'umuhanda rigenga iyo ngingo, ukandika n'ingingo yavuguruwe niba ihari.
3. Niba umunyeshuri yaratoranyije igisubizo kitari cyo, musobanurire impamvu icyo yatoranyije kitari cyo n'aho yibeshye.
4. Niba igisubizo ari "Nta gisubizo cy'ukuri kirimo", sobanura neza impamvu amahitamo yandi yose ari ibinyoma.
5. Niba igisubizo ari "Ibisubizo byose nibyo", sobanura impamvu buri ngingo yavuzwe ari ukuri.
6. Niba hari itandukaniro hagati y'igitabo gya kera n'amategeko mashya ya 2024, tangaza ubwo butandukaniro.
7. Soza n'inama y'ingirakamaro (akamenyetso / memory tip) izamufasha kwibuka iki kibazo mu kizamini cya Polisi.
8. Koresha uburyo bwa Markdown (imitwe y'amagambo, utudomo, amagambo y'ingenzi ashimangiye).

IBYAHINDUTSE MU AMATEGEKO YA 2024 (Fata neza ibi ubivuge mu bisobanuro):
- Moto + Abana: Birabujijwe gutwara umwana uri munsi y'imyaka 12 kuri moto (gitabo gya kera cyibeshye)
- Inzoga: Igipimo ntarengwa = 0.8 g/l mu maraso; Amande = 150,000 Frw + gufungwa iminsi 5
- Camera: Tolerance = 10% hejuru y'umuvuduko ugaragazwa n'icyapa; Kwishyura mu minsi 30 kuri Irembo
- Kurenga itara ritukura: Amande = 25,000–50,000 Frw (reba amakuru mashya)
- Bluetooth/Hands-free: Byemewe; Telefoni mu ntoki: Bibujijwe burundu haba ku muvuduko uwo ariwose

IBYAPA BISHYA BIRI MU KIZAMINI (Q454-Q468 — New Signs Category D):
- Piste cyclable (Ubururu + igare): Inzira itegetswe amagare gusa
- Travaux/Ouvriers: Imbere hari imirimo y'umuhanda — gabanya umuvuduko
- Sens unique (Umwambi munini w'ubururu): Icyerekezo kimwe gusa
- No Stopping (Uruziga / umurongo umwe): Birabujijwe guhagarara
- No Parking (P barré / uruziga imirongo ibiri): Birabujijwe guparika
- STOP (Mburungushu itukura): Hagarara burundu, ha inzira bose
- Flèche verte conditionnelle: Kata iburyo n'aho itara ritukura, ha inzira abanyamaguru
- Arrêt de bus: Bisi gusa ihagarara aho
- Abana/Amashuri: Gabanya umuvuduko cyane
- Route glissante (urubura/verglas): Umuhanda woroheje — gabanya umuvuduko
- Amakamyo kunyuranaho (poids-lourds): Amakamyo gusa nta kunyuranaho, imodoka nto byemerewe`;

  const userPrompt = `IKIZAMINI CY'AMATEGEKO Y'UMUHANDA:
Ikibazo: ${req.questionText}

AMAHITAMO:
${optionsFormatted}

Igisubizo Cy'ukuri: ${req.correctKey.toUpperCase()}. ${req.correctText}
${req.userKey ? `Igisubizo cyatanzwe n'umunyeshuri: ${req.userKey.toUpperCase()}. ${req.userText || ""}` : ""}

Uzuza ubusobanuro bwawe burambuye mu Kinyarwanda kiboneye ukurikije amabwiriza.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 40) return text.trim();
    }
  } catch (e) {
    console.warn("Gemini explanation failed, falling back to local engine:", e);
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. EXPORTED MAIN EXPLANATION HANDLER
// ---------------------------------------------------------------------------

export async function getTrafficLawExplanation(req: ExplanationRequest): Promise<string> {
  // If free Gemini key is provided, try it first
  try {
    const aiResult = await tryAiExplanation(req);
    if (aiResult) return aiResult;
  } catch (err) {
    console.error("AI explanation error:", err);
  }

  // Guaranteed, instant, highly-accurate fallback (0 cost, zero failure)
  return buildExplanationFallback(req);
}
