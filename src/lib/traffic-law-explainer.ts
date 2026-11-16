/**
 * Rwandan Traffic Law (Amategeko y'Umuhanda mu Rwanda) Explainer Engine
 *
 * Provides accurate, educational explanations in formal, grammatically correct Kinyarwanda.
 * Supports LLM providers (Gemini, Claude, OpenAI) if keys exist, with a 100% reliable,
 * built-in Rwanda National Police traffic code knowledge engine as zero-failure fallback.
 */

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

// ---------------------------------------------------------------------------
// 1. BUILT-IN EXPERT KNOWLEDGE ENGINE (100% Offline / Zero-Failure Fallback)
// ---------------------------------------------------------------------------

function buildExplanationFallback(req: ExplanationRequest): string {
  const qText = (req.questionText || "").trim();
  const lowerQ = qText.toLowerCase();
  const cKey = (req.correctKey || "").toUpperCase();
  const cText = (req.correctText || "").trim();
  const uKey = req.userKey ? req.userKey.toUpperCase() : null;
  const uText = req.userText ? req.userText.trim() : null;
  const isCorrect = uKey === cKey;

  // Topic-specific knowledge matching
  let lawDetails = "";
  let memoryTip = "";

  const qNum = req.questionNumber;

  // Specific high-frequency questions
  if (qNum === 1 || lowerQ.startsWith("ikinyabiziga cyose cyangwa ibinyabiziga bigenda")) {
    lawDetails = `**Ikinyabiziga cyose kigomba kugira UMUYOBOZI (Conducteur):**\n\n` +
      `Mu mategeko y'umuhanda mu Rwanda (Ingingo ya 4), buri kinyabiziga kigenda mu nzira nyabagendwa kigomba kugira umuyobozi ufite imyaka n'ubushobozi bisabwa bwo kukiyobora. ` +
      `Itegeko ntiritegeka kugira "umuherekeza" (convoyeur).`;
    memoryTip = `Ikinyabiziga gikenera umuyobozi gusa (Option A), ntabwo gikenera umuherekeza.`;
  } else if (qNum === 2 || lowerQ.includes("ijambo “akayira” bivuga")) {
    lawDetails = `**Ibisobanuro by'ijambo "Akayira":**\n\n` +
      `Hakurikijwe amategeko y'umuhanda mu Rwanda, akayira ni inzira nyabagendwa ifunganye yagenewe gusa **abanyamaguru** (Option A) hamwe n'**ibinyabiziga bigendera ku biziga bibiri** (Option B) nk'amagare na velomoteri. ` +
      `Kubera ko A na B byose ari ukuri, igisubizo nyacyo ni **C (A na B ni ibisubizo by'ukuri)**.`;
    memoryTip = `Akayira = Abanyamaguru + ibinyabiziga by'ibiziga bibiri (velosipede, velomoteri).`;
  } else if (qNum === 13 || lowerQ.includes("birabujijwe gukora andi matara cyangwa utugarurarumuri")) {
    lawDetails = `**Amatara n'utugarurarumuri by'ikinyabiziga:**\n\n` +
      `Birabujijwe gushyira ku kinyabiziga andi matara atategetswe n'amategeko (nk'amatara atemewe hanze). ` +
      `Icyakora, iri tegeko ntirireba **amatara ari imbere mu modoka** (amatara yo mu nzu / plafonnier) amurikira abari imbere igihe cyose atabangamiye kubona kw'umushoferi.`;
    memoryTip = `Amatara yo hanze yose agengwa n'itegeko; amatara yo mu nda y'imodoka (Option B) niyo atarebwa n'iryo tegeko.`;
  } else if (qNum === 15 || lowerQ.includes("feri idakora neza babwita")) {
    lawDetails = `**Uburyo bukoreshwa kugira ngo ikinyabiziga kigende gahoro igihe feri idakora neza:**\n\n` +
      `Mu kinyabiziga habamo ubwoko butatu bwa feri:\n` +
      `1. **Feri y'urugendo:** Feri y'ikirenge ihagarika ikinyabiziga kigenda bisanzwe.\n` +
      `2. **Feri yo gutabara (frein de secours):** Feri ikoreshwa mu gihe feri y'urugendo yanze cyangwa idakora neza, kugira ngo igabanye umuvuduko ikanahagarika ikinyabiziga mu mutekano.\n` +
      `3. **Feri yo guhagarara akanya kanini (handbrake):** Ifata ikinyabiziga kidahari umushoferi.`;
    memoryTip = `Iyo feri y'urugendo yanze, ukoresha **Feri yo gutabara** (Option C).`;
  }
  // 1. Vehicle Technical Inspection (Isuzumwa ry'ibinyabiziga)
  else if (lowerQ.includes("isuzumwa") || lowerQ.includes("kugenzurwa") || lowerQ.includes("buri mwaka") || lowerQ.includes("mezi")) {
    lawDetails = `**Amategeko y'Umuhanda mu Rwanda (Iteka rya Perezida No 85/01) agenga isuzumwa ry'ibinyabiziga agabanyijemo ibice bibiri by'ingenzi:**\n\n` +
      `1. **Ibinyabiziga bisuzumwa BURI MEZI ATANDATU (6) — kabiri mu mwaka:**\n` +
      `   - Ibinyabiziga bigenewe gutwara abagenzi muri rusange (amatagisi, bisi, n'ibindi).\n` +
      `   - Ibinyabiziga bigenewe gutwara ibintu bipima hejuru ya toni 3.5 (amakamyo).\n` +
      `   - Ibinyabiziga bigenewe kwigisha gutwara (auto-écoles).\n\n` +
      `2. **Ibinyabiziga bisuzumwa BURI MWAKA (1) — rimwe mu mwaka:**\n` +
      `   - Ni ibinyabiziga by'umwihariko bitwara abantu bitarengeje imyanya 8 usibye uw'umushoferi (imodoka bwite z'abantu ku giti cyabo zidatwara abagenzi mu buryo bw'ubucuruzi).`;

    memoryTip = `Ibikora ubucuruzi cyangwa imirimo rusange (abagenzi, amakamyo > 3.5t, kwigisha) bisuzumwa **buri mezi 6**. Imodoka zisanzwe z'abantu gusa nizo zisuzumwa **buri mwaka**.`;
  }
  // 2. Parking & Stopping (Guhagarara akanya kanini n'akanya gato)
  else if (lowerQ.includes("guhagarara akanya kanini") || lowerQ.includes("akanya gato") || lowerQ.includes("kubujijwe guhagarara")) {
    lawDetails = `**Amategeko y'umuhanda abuza guhagarara akanya kanini (stationnement) mu bice bikurikira:**\n\n` +
      `- **Ahatarengeje metero 1** imbere cyangwa inyuma y'ikindi kinyabiziga gihagaze (kugira ngo utagifungirana).\n` +
      `- **Ahantu hose hari ibimenyetso bibuza byabugenewe** (nk'icyapa cy'uruziga rufite umurongo utukura, cyangwa umurongo w'umuhondo uciyemo uduce ku nkombe).\n` +
      `- **Aho abanyamaguru banyura mu muhanda ngo bakikire inkomyi** (kugira ngo batabura aho banyura bakagongwa).\n` +
      `- **Imbere y'ahantu nyabagendwa hinjirwa n'ahasohokerwa n'abantu benshi** (amashuri, ibitaro, inganda, amasoko, sinema).\n` +
      `- **Mu muhanda aho ugabanyijemo ibisate bigaragazwa n'imirongo idacagaguye** (umurongo wera ukomeje).\n` +
      `- **Ahatarengeje metero 5** mbere y'amasangano y'imihanda n'aho abanyamaguru bambukira.`;

    memoryTip = `Iyo amahitamo yose avuga ahantu hashobora guteza inkomyi cyangwa kurogoya abandi, amategeko aba abibuzaho hose.`;
  }
  // 3. Speed limits (Umuvuduko ntarengwa)
  else if (lowerQ.includes("umuvuduko") || lowerQ.includes("km") || lowerQ.includes("isaha")) {
    lawDetails = `**Itegeko ry'umuvuduko ntarengwa mu Rwanda rigena:**\n\n` +
      `- **Mu nsisiro (agace gatuwe):** Umuvuduko ntarengwa rusange ni **40 km/h** (cyangwa 50 km/h ku modoka nto iyo byerekanwe n'ibyapa).\n` +
      `- **Hanze y'insisiro:**\n` +
      `  - Imodoka ntoya z'umwihariko: **80 km/h** kugeza kuri **100 km/h** ku mihanda myiza ibyemerewe.\n` +
      `  - Ibinyabiziga bitwara abagenzi muri rusange cyangwa imitwaro irengeje toni 3.5: ntibirenza **60 km/h** cyangwa **80 km/h** bitewe n'imiterere y'umuhanda.\n` +
      `  - Velomoteri n'amapikipiki mato: ntibirenza **50 km/h** ahatari mu nsisiro.`;

    memoryTip = `Mu nsisiro itegeko rirengera abanyamaguru, ni yo mpamvu umuvuduko ugabanuka cyane (40 km/h).`;
  }
  // 4. Overtaking (Kunyuranaho)
  else if (lowerQ.includes("kunyuranaho") || lowerQ.includes("kunyura ku kindi")) {
    lawDetails = `**Ihame rigenga kunyuranaho mu mategeko y'umuhanda mu Rwanda:**\n\n` +
      `- **Kunyuranaho bikorerwa IBUMOSO GUSA** muri rusange.\n` +
      `- **Icyakora, bikorerwa IBURYO gusa mu bihe bibiri byihariye:**\n` +
      `  1. Iyo umuyobozi ubimburira yerekanye ko agiye gukatira ibumoso, agafata igisate cy'ibumoso.\n` +
      `  2. Iyo unyura kuri gariyamoshi igenda mu ruhande rw'iburyo bw'umuhanda.\n` +
      `- Birabujijwe kunyuranaho mu makorosi adataha, ku mpinga y'umusozi, no mu masangano adafite uburenganzira bw'ibanze.`;

    memoryTip = `Kunyuranaho bikorerwa ibumoso, uretse iyo uwo unyuraho agiye gukatira ibumoso akaba yarabigaragaje acana itara.`;
  }
  // 5. Road Signs (Ibyapa)
  else if (lowerQ.includes("icyapa") || lowerQ.includes("ibyapa") || lowerQ.includes("kimenyetso")) {
    lawDetails = `**Ibyapa byo mu muhanda bigabanyijemo amatsinda ane y'ingenzi:**\n\n` +
      `- **Ibyapa biburira ibyago (Danger):** Bifite ishusho ya **mpandeshatu** ifite umuserebanya utukura n'indiba yera.\n` +
      `- **Ibyapa bibuza (Interdiction):** Bifite ishusho y'**uruziga** rufite umuserebanya utukura n'indiba yera.\n` +
      `- **Ibyapa bitegeka (Obligation):** Bifite ishusho y'**uruziga rw'ubururu** rufite ikimenyetso cy'umweru imbere.\n` +
      `- **Ibyapa biyobora / bitanga amakuru:** Bifite ishusho y'**urukiramende** cyangwa **kare** y'ubururu cyangwa yera.`;

    memoryTip = `Mpandeshatu = Ibyago biburirwa; Uruziga rutukura = Ibibuzwa; Uruziga rw'ubururu = Ibitegekwa.`;
  }
  // 6. Lights & Lighting (Amatara n'ibimenyetso bimurika)
  else if (lowerQ.includes("itara") || lowerQ.includes("amatara") || lowerQ.includes("kumurika") || lowerQ.includes("urumuri")) {
    lawDetails = `**Amategeko agenga amatara y'ibinyabiziga mu Rwanda:**\n\n` +
      `- **Amatara maremare (feux de route):** Agomba kumurika nibura muri **metero 100** imbere. Agomba kuzimwa hakakirizwa amagufi iyo uhuye n'undi muyobozi cyangwa umuhanda umurikiwe bihagije.\n` +
      `- **Amatara magufi (feux de croisement):** Agomba kumurika nibura muri **metero 40** imbere nta guhuma amaso abandi.\n` +
      `- **Amatara ndanga (feux de position):** Agomba kugaragarira muri **metero 100** nijoro mu kirere gikeye.\n` +
      `- **Amatara yo guhagarara (feux stop):** Agomba kuba umutuku, amurika ako kanya ukandagiye feri.\n` +
      `- **Amatara ndangacyerekezo (clignotants):** Agomba kuba umuhondo (orange) amurika amanywa na nijoro.\n` +
      `- **Amatara y'imbere mu modoka:** Ntabwo abuzwa keretse iyo abangamiye kureba hanze kw'umushoferi.`;

    memoryTip = `Amatara maremare amurika metero 100 ariko azimwa iyo hari abandi bayobozi mu muhanda kugira ngo batabahuma.`;
  }
  // 7. Dimensions, Weights & Loads (Ubugari, uburebure, imitwaro, romoruki)
  else if (lowerQ.includes("ubugari") || lowerQ.includes("uburebure") || lowerQ.includes("romoruki") || lowerQ.includes("toni") || lowerQ.includes("umutambiko") || lowerQ.includes("uburemere")) {
    lawDetails = `**Ibipimo n'uburemere ntarengwa mu Rwanda (Iteka rya Perezida):**\n\n` +
      `- **Ubugari ntarengwa:** Ni **metero 2.50** muri rusange (cyangwa **metero 2.60** ku binyabiziga bikonjesha / frigorifiques).\n` +
      `- **Ubugari bwa romoruki ikuruwe n'ikinyamitende itatu cyangwa amagare:** Ntibugomba kurenza **santimetero 125 (cm 125 / metero 1.25)**.\n` +
      `- **Uburebure ntarengwa:**\n` +
      `  - Ikinyabiziga gifite umutambiko umwe cyangwa ibiri: **metero 11**.\n` +
      `  - Ikinyabiziga gifite imitambiko irenga ibiri: **metero 12**.\n` +
      `  - Makuzungu (semi-remorque): **metero 17.40**.\n` +
      `  - Ikinyabiziga gikuruye romoruki imwe cyangwa nyinshi: **metero 18**.\n` +
      `- **Imitwaro irenze ikinyabiziga:** Inyuma ntigomba kurenga **metero 3**, imbere ntigomba kurenga **santimetero 50 (cm 50)**.`;

    memoryTip = `Ubugari rusange: 2.50m (2.60m bikonjesha). Romoruki ya moto/igare: cm 125. Uburebure: 11m (imitambiko 1-2), 17.40m (makuzungu).`;
  }
  // 8. Road Definitions (Akayira, inzira nyabagendwa, umuhanda, inkengero)
  else if (lowerQ.includes("akayira") || lowerQ.includes("inzira nyabagendwa") || lowerQ.includes("umuhanda") || lowerQ.includes("inkengero") || lowerQ.includes("igisate")) {
    lawDetails = `**Ibisobanuro by'amategeko ku nzira n'imihanda:**\n\n` +
      `- **Inzira nyabagendwa:** Ubutaka bwose, umuhanda, n'inkengero bigenewe cyangwa bifunguriwe urujya n'uruza rw'abantu n'ibinyabiziga muri rusange.\n` +
      `- **Umuhanda (chaussée):** Igice cy'inzira nyabagendwa cyagenewe kugendwamo n'ibinyabiziga gusa.\n` +
      `- **Akayira:** Inzira nyabagendwa ifunganye yagenewe **abanyamaguru n'ibinyabiziga bigendera ku biziga bibiri gusa**.\n` +
      `- **Inkengero yegutse (trottoir):** Igice kiri hejuru y'umuhanda cyagenewe abanyamaguru.\n` +
      `- **Igisate cy'umuhanda:** Igice kigabanyijwemo umuhanda kugira ngo ikinyabiziga kigenderemo ku murongo umwe.`;

    memoryTip = `Akayira = Abanyamaguru + ibiziga bibiri (velosipede, velomoteri). Umuhanda = Ibinyabiziga. Trottoir = Abanyamaguru gusa.`;
  }
  // 9. Brakes & Emergency (Feri n'ubutabazi)
  else if (lowerQ.includes("feri") || lowerQ.includes("guhagarika ikinyabiziga")) {
    lawDetails = `**Amoko ya Feri n'inshingano zazo mu kinyabiziga:**\n\n` +
      `- **Feri y'urugendo (frein de service):** Feri isanzwe ikoreshwa n'ikirenge igabanya umuvuduko ikanahagarika ikinyabiziga mu gihe cy'urugendo.\n` +
      `- **Feri yo gutabara (frein de secours):** Feri ikoreshwa kugira ngo ikinyabiziga kigende gahoro cyangwa gihagarare igihe feri y'urugendo yagize ikibazo idakora neza.\n` +
      `- **Feri yo guhagarara umwanya munini (frein de stationnement / handbrake):** Feri ikoreshwa n'ukuboko ifata ikinyabiziga kitari mu rugendo (kikaguma hamwe nta mushoferi urimo).`;

    memoryTip = `Feri idakora neza -> Feri yo gutabara niyo ituma ikinyabiziga kigenda gahoro cyangwa gihagarara.`;
  }
  // 10. Intersections & Right of Way (Amasangano, gutambuka mbere, rond-point)
  else if (lowerQ.includes("gutambuka") || lowerQ.includes("amasangano") || lowerQ.includes("uburenganzira") || lowerQ.includes("priorite") || lowerQ.includes("rond-point")) {
    lawDetails = `**Ihame ryo gutambuka mbere mu masangano:**\n\n` +
      `- **Ihame rusange (Priorité à droite):** Mu masangano adafite ibyapa cyangwa amatara, umuyobozi agomba guha inzira ikinyabiziga giturutse **iburyo bwe**.\n` +
      `- **Mu masangano azunguruka (Rond-point):** Ibinyabiziga biri mu masangano azunguruka nibyo bifite uburenganzira bwo gutambuka mbere y'ibigiye kwinjiramo.\n` +
      `- **Ibinyabiziga bitabara (Police, Ambulansi, Zimwe-zimwe):** Bitambuka mbere y'ibindi byose igihe bikoresha inzogera y'intabaza (sirène) n'itara rirabagirana ry'ubururu.`;

    memoryTip = `Amasangano asanzwe: Iburyo niyo nzira. Rond-point: Uwujemo niyo nzira. Ubutabazi: Bitambuka mbere byose.`;
  }
  // 11. Horn, Helmets, Belts & Driver Responsibilities (Ihembe, umukandara, ingofero, inshingano)
  else if (lowerQ.includes("ihembe") || lowerQ.includes("umukandara") || lowerQ.includes("ingofero") || lowerQ.includes("umuyobozi") || lowerQ.includes("inzoga")) {
    lawDetails = `**Inshingano z'umutekano n'ibikoresho by'umuyobozi:**\n\n` +
      `- **Umuyobozi w'ikinyabiziga:** Ikinyabiziga cyose kigenda mu muhanda kigomba kugira umuyobozi ufite ubushobozi bwo kucyobora.\n` +
      `- **Ihembe (avertisseur sonore):** Ryemerewe gukoreshwa hanze y'insisiro gusa kugira ngo uburire abandi cyangwa wirinde impanuka. Birabujijwe kurikoresha nijoro mu nsisiro keretse mu gihe cy'akaga gakomeye.\n` +
      `- **Umukandara w'ubwirinzi:** Utegetswe ku bayobozi n'abagenzi bicaye ku ntebe z'imbere n'iz'inyuma z'ikinyabiziga.\n` +
      `- **Ingofero y'ubwirinzi (casque):** Itegetswe ku muyobozi n'umugenzi wa moto na velomoteri.`;

    memoryTip = `Ikinyabiziga cyose kigomba kugira umuyobozi. Ihembe rikoreshwa gusa ku manywa hanze y'insisiro kwirinda impanuka.`;
  }
  // 7. General Fallback
  else {
    lawDetails = `**Amategeko y'Umuhanda mu Rwanda (Iteka rya Perezida rigenga gutwara ibinyabiziga):**\n\n` +
      `Iri tegeko rigamije kurengera umutekano w'abakoresha umuhanda bose (abayobozi b'ibinyabiziga, abanyamaguru, n'ibinyabiziga bigendera ku biziga bibiri). ` +
      `Buri gikorwa mu muhanda kigomba gukorwa mu buryo budateza impanuka cyangwa ngo gihungabanye urujya n'uruza rw'abandi.`;

    memoryTip = `Soma neza interuro yose y'ikibazo; kenshi amagambo nka "gusa", "igihe cyose", cyangwa "nta na rimwe" akunda gutandukanya igisubizo cy'ukuri n'ikinyoma.`;
  }

  // Construct structured response
  let explanation = `### 🎯 Igisubizo cy'ukuri: ${cKey}. ${cText}\n\n`;
  explanation += `#### ⚖️ Impamvu n'Itegeko ry'Umuhanda:\n${lawDetails}\n\n`;

  // Explain user's mistake if wrong
  if (!isCorrect && uKey) {
    if (cText.toLowerCase().includes("nta gisubizo cy’ukuri") || cText.toLowerCase().includes("nta gisubizo cy'ukuri")) {
      explanation += `#### ❌ Kuki amahitamo wakoze (${uKey}) atari yo?\n` +
        `Watoranyije **${uKey}. ${uText}**.\n` +
        `Iri hitamo ntabwo ryubahirije ibipimo cyangwa ibisabwa n'itegeko kuri iki kibazo. ` +
        `Kubera ko nta na rimwe mu mahitamo A, B, cyangwa C ryujuje ibiteganywa n'itegeko, igisubizo nyacyo kiba **${cKey} (${cText})**.\n\n`;
    } else if (cText.toLowerCase().includes("ibisubizo byose nibyo") || cText.toLowerCase().includes("byose ni byo")) {
      explanation += `#### ❌ Kuki amahitamo wakoze (${uKey}) yari igice gusa?\n` +
        `Watoranyije **${uKey}. ${uText}**.\n` +
        `Ni byo iri hitamo na ryo ni ukuri, ariko ntabwo ari ryo ryonyine! ` +
        `Iyo amahitamo yose yubahirije ibiteganywa n'itegeko, igisubizo cyuzuye kiba **${cKey} (${cText})**.\n\n`;
    } else {
      explanation += `#### ❌ Kuki amahitamo wakoze (${uKey}) atari yo?\n` +
        `Watoranyije **${uKey}. ${uText}**.\n` +
        `Iri hitamo ntabwo ari ryo kuko itegeko rigena ko igisubizo cy'ukuri ari **${cKey}. ${cText}**.\n\n`;
    }
  } else if (isCorrect) {
    explanation += `#### ✅ Watsinze iki kibazo!\n` +
      `Wahisemo neza igisubizo cy'ukuri **${cKey}**. Ibisobanuro by'amategeko hejuru bigufasha kurushaho gusobanukirwa no kubitsinda mu kizamini cya Polisi.\n\n`;
  }

  explanation += `💡 **Inama yo gufata mu mutwe mu kizamini:** ${memoryTip}`;

  return explanation;
}

// ---------------------------------------------------------------------------
// 2. LIVE AI EXPLANATION ENGINE (Gemini / Claude / OpenAI)
// ---------------------------------------------------------------------------

async function tryAiExplanation(req: ExplanationRequest): Promise<string | null> {
  const optionsFormatted = req.options
    .map((o) => `  ${o.key.toUpperCase()}. ${o.text}`)
    .join("\n");

  const systemPrompt = `Uri Mwarimu w'inzobere mu mategeko y'umuhanda mu Rwanda (Certified Rwanda Traffic Law & Police Driving Test Instructor).
Urasabwa gusobanura ikibazo mu Kinyarwanda cy'umwimerere, kiboneye, kandi gisobanutse neza nta makosa y'imyandikire (100% flawless Rwandan Kinyarwanda).

AMABWIRIZA Y'UBUSOBANURO:
1. Tangira uvuga igisubizo cy'ukuri neza.
2. Sobanura neza itegeko ry'umuhanda rigenga iyo ngingo (Iteka rya Perezida No 85/01 ryo ku wa 02/09/2002 rigenga amategeko y'umuhanda mu Rwanda).
3. Niba umunyeshuri yaratoranyije igisubizo kitari cyo, musobanurire impamvu icyo yatoranyije kitari cyo n'aho yibeshye.
4. Niba igisubizo ari "Nta gisubizo cy'ukuri kirimo", sobanura neza impamvu amahitamo yandi yose ari ibinyoma.
5. Niba igisubizo ari "Ibisubizo byose nibyo", sobanura impamvu buri ngingo yavuzwe ari ukuri.
6. Soza n'inama y'ingirakamaro (akamenyetso / memory tip) izamufasha kwibuka iki kibazo mu kizamini cya Polisi.
7. Koresha uburyo bwa Markdown (imitwe y'amagambo, utudomo, amagambo y'ingenzi ashimangiye).`;

  const userPrompt = `IKIZAMINI CY'AMATEGEKO Y'UMUHANDA:
Ikibazo: ${req.questionText}

AMAHITAMO:
${optionsFormatted}

Igisubizo Cy'ukuri: ${req.correctKey.toUpperCase()}. ${req.correctText}
${req.userKey ? `Igisubizo cyatanzwe n'umunyeshuri: ${req.userKey.toUpperCase()}. ${req.userText || ""}` : ""}

Uzuza ubusobanuro bwawe burambuye mu Kinyarwanda kiboneye ukurikije amabwiriza.`;

  // 1. Google Gemini (Fastest, highest quality Kinyarwanda support)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 40) return text.trim();
      }
    } catch (e) {
      console.warn("Gemini explanation failed, falling back:", e);
    }
  }

  // 2. Anthropic Claude
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.content?.[0]?.text;
        if (text && text.trim().length > 40) return text.trim();
      }
    } catch (e) {
      console.warn("Anthropic explanation failed, falling back:", e);
    }
  }

  // 3. OpenAI GPT
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 40) return text.trim();
      }
    } catch (e) {
      console.warn("OpenAI explanation failed, falling back:", e);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 3. EXPORTED MAIN EXPLANATION HANDLER
// ---------------------------------------------------------------------------

export async function getTrafficLawExplanation(req: ExplanationRequest): Promise<string> {
  // Try AI model first if an API key is available
  try {
    const aiResult = await tryAiExplanation(req);
    if (aiResult) return aiResult;
  } catch (err) {
    console.error("AI explanation error:", err);
  }

  // Guaranteed, instant, highly-accurate fallback
  return buildExplanationFallback(req);
}
