import json
import os

EXPLANATIONS_PATH = "/home/jambo/Umwali/amategeko/src/data/question_explanations.json"

with open(EXPLANATIONS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Dictionary of high-quality verified explanations for the 114 questions
enhancements = {
    75: {
        "lawTitle": "Ingingo ya 77: Ubutumburuke Ntarengwa bw'Amatara n'Utugarurarumuri",
        "lawDetails": "Nta tara na rimwe cyangwa akagarurarumuri bishobora kuba biri hasi ya santimetero 40 (cm 40) kuva ku butaka igihe ikinyabiziga kidapakiye, keretse amatara kamenabihu (feux de brouillard) n'amatara yo gusubira inyuma (feux de recul). Ibi biterwa n'uko ayo matara ashobora gushyirwa hasi y'icyo gipimo bitewe n'imimerere n'ingano by'ikinyabiziga. Ni yo mpamvu igisubizo ari C (A na B ni ibisubizo by'ukuri).",
        "memoryTip": "Amatara kamenabihu n'ayo gusubira inyuma ashobora kuba munsi ya cm 40 kuva ku butaka."
    },
    93: {
        "lawTitle": "Ingingo ya 104: Icyapa cy'Ahahagarara Bisi n'Imodoka Nini (Arrêt d'autobus)",
        "lawDetails": "Icyapa cyerekana ahantu hagenewe guhagararwamo n'imodoka nini zagenewe gutwara abagenzi (bisi) kirangwa n'ishusho y'urukiramende rufite ubuso bw'umweru, umuzenguruko w'ubururu n'ikirango cy'umukara gishushanyijeho bisi. Kubera ko amahitamo A, B, na C adakomatanya aya mabara yose y'iki cyapa, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Icyapa cy'aho bisi zihagarara kigira ubuso bw'umweru, umuzenguruko w'ubururu n'ikirango cy'umukara."
    },
    102: {
        "lawTitle": "Ingingo ya 101: Icyapa cy'Umuhanda Urombeje w'Ibice Byinshi (Autoroute - F5)",
        "lawDetails": "Icyapa F5 cyerekana ahatangirira amategeko y'umuhanda urombeje w'ibice byinshi (Autoroute) kirangwa n'ubuso bw'ubururu n'ikirango cy'umweru gishushanyijeho imihanda ibiri n'ikiraro hejuru yayo. Ntabwo kirangwa n'umweru n'umukara cyangwa umutuku nk'uko byavuzwe mu mahitamo A, B, C. Ni yo mpamvu igisubizo cy'ukuri ari D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Icyapa cy'umuhanda urombeje (Autoroute) kirangwa n'ubuso bw'ubururu n'ikirango cy'umweru."
    },
    103: {
        "lawTitle": "Ingingo ya 108: Ibimenyetso Byerekana Ahakorerwa Imirimo mu Nzira Nyabagendwa",
        "lawDetails": "Igihe ikorwa ry'imirimo ribangamiye ubwisanzure bwo kugenda mu nzira nyabagendwa, ahakorerwa imirimo hagaragazwa n'inzitiro ziriho imirongo itukura n'yera cyangwa amatara y'umuhondo amyatsa, hakongerwaho ibyapa by'umuhondo by'agateganyo. Kubera ko amahitamo A na B adatanga ibipimo n'amabwiriza yuzuye y'iri tegeko, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Ahakorerwa imirimo hagaragazwa n'inzitiro z'umutuku n'umweru n'amatara amyatsa y'umuhondo."
    },
    104: {
        "lawTitle": "Ingingo ya 96: Icyapa Gitegeka Inzira Yihariye mu Gihe cy'Imirimo (D1)",
        "lawDetails": "Iyo mu muhanda imirimo yihariye ubugari butuma abayobozi bagomba kuva mu mwanya wabo usanzwe, ahategetswe kunyurwa hagaragazwa n'icyapa gitegeka gifite ishusho y'uruziga, ubuso bw'ubururu n'ikirango cy'umweru kigaragaza akambi kerekeza aho bagomba guca (D1). Igisubizo cy'ukuri ni A (Ubuso bw'ubururu ikirango cy'umweru).",
        "memoryTip": "Icyapa gitegeka icyerekezo cyo kunyurwamo gifite ubuso bw'ubururu n'ikirango cy'umweru."
    },
    105: {
        "lawTitle": "Ingingo ya 103: Ibyapa by'Amabwiriza Yihariye mu Byambu no ku Bibuga by'Indege",
        "lawDetails": "Icyapa cyerekana ko hari amabwiriza yihariye mu buryo bwo kugendera mu cyambu cyangwa ku kibuga cy'indege kirangwa n'ishusho mpandenye (kare cyangwa urukiramende), ubuso mu ibara ry'ubururu n'ikirango kiri mu ibara ryera. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Amabwiriza yihariye y'ibyambu/ibibuga by'indege = Ishusho mpandenye, ubuso bw'ubururu n'ikirango cyera."
    },
    107: {
        "lawTitle": "Ingingo ya 91: Ibyapa By'Icyago Cyidahoraho n'Ibyerekezo By'Impanuka",
        "lawDetails": "Ibyapa byerekana icyago cyidahoraho cyangwa iyoborwa ry'agateganyo ry'umuhanda nk'igihe cy'impanuka cyangwa imirimo bifite ubuso bw'ibara ry'umuhondo (jaune) n'imizenguruko itukura. Kubera ko nta hitamo mu yatanzwe ryavuze ibara ry'umuhondo, igisubizo nyacyo ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Ibyapa by'agateganyo/byidahoraho birangwa n'ubuso bw'ibara ry'umuhondo."
    },
    108: {
        "lawTitle": "Ingingo ya 18: Kubangamira Imigendere Isanzwe y'Ibindi Binyabiziga",
        "lawDetails": "Birabujijwe rwose kubangamira abandi bakoresha umuhanda kubera: (A) kugendera ku muvuduko muke cyane bidasobanutse nta mpamvu yumvikana, cyangwa (B) gufata feri bitunguranye kandi nta kaga kagaragara gashobora gutera impanuka. Kubera ko byombi bibujijwe n'itegeko, igisubizo ni C (A na B ni ibisubizo by'ukuri).",
        "memoryTip": "Ntugomba kugenda gake cyane nta mpamvu cyangwa gufata feri bitunguranye nta kaga."
    },
    112: {
        "lawTitle": "Ingingo ya 38: Amategeko yo Guhagarara Akanya Gato n'Akanini",
        "lawDetails": "Uretse igihe hari amategeko yihariye, ikinyabiziga cyose gihagaze akanya gato cyangwa kanini kigomba gushyirwa: (A) ku ruhande rw'iburyo uretse mu nzira y'icyerekezo kimwe aho gishobora no gushyirwa ibumoso, na (B) hanze y'umuhanda ahagenewe guhagararwamo habugenewe igihe hahari. Igisubizo cy'ukuri ni C (A na B ni ibisubizo by'ukuri).",
        "memoryTip": "Guhagarara bikorerwa iburyo cyangwa ahashashe hanze y'umuhanda."
    },
    113: {
        "lawTitle": "Ingingo ya 42: Kugaragaza Ikinyabiziga Gihagaze Nijoro",
        "lawDetails": "Iyo ikinyabiziga gihagaritswe nijoro ahantu hatabona neza ku buryo abandi batakibona hakiri kare, kigomba kugaragazwa na: (A) amatara yacyo yo guhagarara (feux de position) n'itara ry'umutuku ry'inyuma, hamwe na (B) icyapa cy'impandeshatu itukura itegetswe gushyirwa inyuma yacyo nibura muri metero 50. Igisubizo cy'ukuri ni C (A na B ni ibisubizo by'ukuri).",
        "memoryTip": "Nijoro: Gucana amatara yo guhagarara no gushyiraho mpandeshatu itukura birategetswe."
    },
    114: {
        "lawTitle": "Ingingo ya 12: Imigendere y'Abanyamaguru mu Mihanda",
        "lawDetails": "Abanyamaguru batatanye bategetswe kugendera ku nkombe y'umuhanda cyangwa mu kayira k'abanyamaguru. Ariko (A) abanyamaguru bashaka guhagarara akanya gato igihe bambukiranya umuhanda bemerewe guhagarara ku kirwa cy'umutekano (refuge) kiri hagati mu muhanda. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Abanyamaguru bambuka bemerewe guhagarara ku kirwa cy'umutekano hagati mu muhanda."
    },
    120: {
        "lawTitle": "Ingingo ya 73: Ubwikorere Ntarengwa ku Makamyo (Charge Maximale)",
        "lawDetails": "Mu mujyi no ku mihanda y'igihugu igenwa na Minisitiri ushinzwe gutwara abantu n'ibintu, ubwikorere ntarengwa bubarirwa ku miterere y'imitambiko (essieux): umutambiko umwe ni toni 10, imitambiko ibiri ni toni 16, naho amakamyo manini akagira toni 24 cyangwa 28. Kubera ko nta gipimo cy'ukuri cyavuzwe mu mahitamo A, B, C, igisubizo ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Ubwikorere ntarengwa bubarirwa ku mubare n'ubwoko bw'imitambiko (essieux)."
    },
    121: {
        "lawTitle": "Ingingo ya 90: Icyapa cy'Inyongera Cyerekana Intera (Panneau de distance)",
        "lawDetails": "Iyo bitewe n'imiterere y'ahantu intera itandukanya icyapa n'ahantu habi iri munsi ya metero 150 ku buryo bugaragara, iyo ntera igaragazwa n'icyapa cy'inyongera cy'urukiramende rufite ubuso bw'ibara ryera n'inyandiko y'umukara igaragaza intera (urugero: 50m cyangwa 100m). Igisubizo cy'ukuri ni B (Urukiramende rufite ubuso bw'ibara ryera).",
        "memoryTip": "Intera iri munsi ya 150m igaragazwa n'urukiramende rwera rw'inyongera ruriho imibare n'inyuguti ya m."
    },
    125: {
        "lawTitle": "Ingingo ya 77: Utugarurarumuri twa Romoruki Zose",
        "lawDetails": "Romoruki zose zidatandukanyijwe ubugari bwazo zigomba kugira nibura utugarurarumuri tubiri tw'imfuruka eshatu (mpandeshatu) z'umutuku zireba inyuma. Nta romoruki n'imwe yemerewe kugira akagarurarumuri kamwe gusa n'iyo yaba ifite ubugari bwa santimetero 80. Igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Romoruki igomba guhora ifite nibura utugarurarumuri tubiri twa mpandeshatu z'umutuku inyuma."
    },
    127: {
        "lawTitle": "Ingingo ya 44: Kugaragaza Ibinyabiziga Iyo Bitabona Neza muri Metero 200",
        "lawDetails": "Iyo bitewe n'uko bwije cyangwa ikirere kirimo ibihu n'imvura bitagishoboka kubona muri metero 200, ibinyabiziga bigomba kugaragazwa n'amatara y'urugendo cyangwa ayo kubona aho ugana (A) hamwe n'amatara ndangambere n'amatara yo gusubira inyuma (B) ku binyabiziga biyategetswe. Igisubizo cy'ukuri ni C (A na B ni ibisubizo by'ukuri).",
        "memoryTip": "Iyo kureba birenga metero 200 bitagishoboka, gucana amatara birategetswe."
    },
    132: {
        "lawTitle": "Ingingo ya 70: Ibinyabiziga Byemerewe Gukoresha Inzira Nyabagendwa",
        "lawDetails": "Birabujijwe kugendesha mu nzira nyabagendwa imodoka cyangwa romoruki zifite inziga zishobora kwangiza umuhanda (nk'izifite iminyururu cyangwa inziga z'ibyuma bidafite amapine), keretse imashini zikoreshwa mu kubaka no gusana imihanda (C) zibifitiye uruhushya rwihariye. Igisubizo cy'ukuri ni C (Imashini zikoreshwa mu kubaka imihanda).",
        "memoryTip": "Imashini zubaka imihanda zifite uruhushya zishobora gukoresha inziga z'ibyuma aho zikorera."
    },
    135: {
        "lawTitle": "Ingingo ya 95: Aho Ibyapa Bibuza n'Ibitegeka Bikurikizwa",
        "lawDetails": "Ibyapa bibuza n'ibitegeka bitangira gukurikizwa aho bishinze kugeza ku masangano (inkomane) akurikiyeho ku ruhande rw'inzira bishinzeho, keretse iyo hari icyapa cy'inyongera cyerekana intera cyangwa icyapa kimenyesha iherezo ry'icyo kibuzwa. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Ibyapa bibuza n'ibitegeka bireba igice kiri hagati y'aho bishinze n'inkomane ikurikiyeho."
    },
    136: {
        "lawTitle": "Ingingo ya 105: Amabara y'Icyapa cy'Ubutabazi n'Ubugoboko bw'Ibinyabiziga",
        "lawDetails": "Icyapa cy'inyongera cyerekana aho bagobokera ibinyabiziga (poste de dépannage) kirangwa n'amabara y'umweru, umukara n'ubururu (ubuso bw'ubururu n'agakoresho k'umukara gashushanyije ku kadomo k'umweru). Igisubizo cy'ukuri ni B (Umweru, umukara, ubururu).",
        "memoryTip": "Icyapa cy'ubugoboko bw'ibinyabiziga kigizwe n'umweru, umukara n'ubururu."
    },
    137: {
        "lawTitle": "Ingingo ya 90: Icyapa cy'Inyongera Cyerekana Uburebure bw'Ahari Ibyago",
        "lawDetails": "Icyapa cyerekana uburebure bw'igice cy'umuhanda kiberamo ibyago kirangwa n'urukiramende rw'ubuso bw'umweru ruriho inyandiko y'umukara hagati y'utwambi tubiri tureba hejuru (^ 500m ^). Kubera ko amahitamo A, B, C atatanze ibi bisobanuro by'utwambi n'amabara, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Uburebure bw'igice cy'ibyago bugaragazwa n'utwambi tubiri tureba hejuru ku cyapa cy'umweru."
    },
    178: {
        "lawTitle": "Ingingo ya 27: Aho Kunyuranaho mu Muhanda",
        "lawDetails": "Kunyuranaho bikorerwa mu muhanda gusa. Umuyobozi abujijwe rwose guca mu kayira k'abanyamaguru, mu tuyira tw'amagare cyangwa ku tuyira two ku nkengero z'umuhanda kugira ngo anyure ku kindi kinyabiziga kuko byateza impanuka ikomeye. Igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo kuko bitamwemerera na rimwe).",
        "memoryTip": "Kunyura mu kayira k'abanyamaguru cyangwa ku tuyira tw'amagare unyuranaho birabujijwe rwose."
    },
    179: {
        "lawTitle": "Ingingo ya 80: Icyapa cy'Umuvuduko Ntarengwa ku Binyabiziga Binini",
        "lawDetails": "Icyapa cy'uruziga kimenyesha umuvuduko ntarengwa ikinyabiziga kitagomba kurenza gishyirwa inyuma ku binyabiziga bifite uburemere burenga toni 3.5 n'ibitwara abagenzi muri rusange, ntabwo bishingira ku burebure gusa bw'ikinyabiziga. Kubera ko amahitamo A, B, C atatanze iyi ngingo, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Icyapa cy'umuvuduko inyuma gishingira ku buremere burenze 3.5t n'ibitwara abagenzi, si uburebure gusa."
    },
    185: {
        "lawTitle": "Ingingo ya 85: Feri yo Gutabara (Frein de Secours)",
        "lawDetails": "Uburyo bukoreshwa kugira ngo ikinyabiziga kigende gahoro cyangwa gihagarare igihe feri y'urugendo idakora neza bwitwa FERI YO GUTABARA (frein de secours). Iri tegeko rigamije ko ikinyabiziga gihora gifite uburyo bwa kabiri bwo guhagarara igihe uburyo bwa mbere bupfuye. Igisubizo cy'ukuri ni C (Feri yo gutabara).",
        "memoryTip": "Feri yo gutabara ikoreshwa mu gihe feri y'urugendo yanze cyangwa yagize ikibazo."
    },
    190: {
        "lawTitle": "Ingingo ya 83: Amapine n'Inziga z'Ibinyabiziga",
        "lawDetails": "Ibiziga byose by'ibinyabiziga bigendeshwa na moteri bigomba kuba byambaye inziga z'umwuka (pneus) zifite imirongo ifashe neza. Ibinyabiziga bidapakiye kandi bitajya birenza umuvuduko wa km 25 mu isaha nibyo byonyine bishobora gukoresha amapine akomeye adafite umwuka. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Ibinyabiziga bidapakiye kandi bitarenza km 25/h byemerewe amapine adafite umwuka."
    },
    199: {
        "lawTitle": "Ingingo ya 73: Uburemere Ntarengwa ku Mutambiko (Charge à l'essieu)",
        "lawDetails": "Uretse mu mijyi, ku yindi mihanda yagenwe na Minisitiri ushinzwe gutwara ibintu n'abantu, uburemere ntarengwa bwemewe ku mutambiko umwe (essieu simple) w'ikinyabiziga ni TONI 12 (ku mitambiko y'ikoranabuhanga ritwaza imitwaro minini). Igisubizo cy'ukuri ni A (Toni 12).",
        "memoryTip": "Uburemere ntarengwa ku mutambiko wemewe ku mihanda minini bugera kuri toni 12."
    },
    204: {
        "lawTitle": "Ingingo ya 50: Amatara y'Inyuma mu Gihe cy'Ibihu n'Imvura",
        "lawDetails": "Iyo kuva bwije kugeza bukeye cyangwa bitewe n'ibihu n'imvura bidashoboka kubona muri metero 200, inyuma y'ikinyabiziga cyangwa uruhererekane rw'ibinyabiziga hagomba kugaragarira itara ry'umutuku ritwariwe ibumoso n'umuntu uri ku murongo w'inyuma hafi y'umurongo ugabanya umuhanda mo kabiri. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Itara ry'umutuku ry'inyuma rigomba guhora rigaragarira ku ruhande rw'ibumoso."
    },
    207: {
        "lawTitle": "Ingingo ya 77: Ubutumburuke bw'Amatara n'Utugarurarumuri",
        "lawDetails": "Nta tara na rimwe cyangwa akagarurarumuri bishobora kuba biri munsi ya santimetero 40 (cm 40) kuva ku butaka, keretse kamenabihu n'iryo gusubira inyuma. Kubera ko nta mahitamo muri A, B, C yatanze iki gipimo cy'ukuri cy'itegeko, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Itegeko risaba ubutumburuke bwa santimetero 40 (cm 40) kuva ku butaka."
    },
    210: {
        "lawTitle": "Ingingo ya 72: Ubugari bw'Imizigo ku Ipikipiki ifite Akanyabiziga k'Impande",
        "lawDetails": "Ubugari bw'imizigo yikorewe n'ipikipiki ifite akanyabiziga ko ku ruhande (side-car) ntibushobora kurenga ubugari bw'icyo kinyabiziga ku ntera irenze santimetero 30 (cm 30) ku mpande zombi. Igisubizo cy'ukuri ni B (cm 30).",
        "memoryTip": "Umzigo ku ipikipiki ntushobora kurenga cm 30 ku mpera z'impande zayo."
    },
    224: {
        "lawTitle": "Ingingo ya 89: Ibyapa Byitonderwa Hafi y'Abanyamagare",
        "lawDetails": "Iyo wegereye umunyamagare mu muhanda, ugomba kwitondera icyapa kigaragaza aho inzira y'amagare yambukiranya umuhanda (A10) cyangwa icyapa gitegeka inzira y'amagare (D4). Igisubizo cy'ukuri ni C (d)).",
        "memoryTip": "Witondera icyapa kiburira cyangwa gitegeka inzira y'amagare."
    },
    234: {
        "lawTitle": "Ingingo ya 98: Icyapa C20 - Iherezo ry'Ibibuzwa Byose mu Karere",
        "lawDetails": "Icyapa cy'uruziga rw'umweru rucitsemo umurongo w'umukara ucuramye (C20) kimenyesha: IHEREZO RY'IBIBUZWA BYOSE ku binyabiziga bigenda muri ako gace. Kirangiza ibibuzwa byose byatanzwe n'ibyapa bibuza byari bibanje. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Uruziga rwera rurimo umurongo w'umukara ucuramye = Iherezo ry'ibibuzwa byose (C20)."
    },
    235: {
        "lawTitle": "Ingingo ya 96: Ishusho y'Ibyapa Bitegeka (Signaux d'obligation)",
        "lawDetails": "Ibyapa bitegeka bigizwe n'ishusho y'URUZIGA rufite ubuso bw'ibara ry'ubururu n'ikirango cy'umweru. Igisubizo cy'ukuri ni C (d)).",
        "memoryTip": "Ibyapa bitegeka = Ishusho y'uruziga rw'ubururu n'ikirango cyera."
    },
    236: {
        "lawTitle": "Ingingo ya 94: Icyapa C3 - Kubuza Ibinyabiziga Bifite Moteri Kuhanyura",
        "lawDetails": "Icyapa kirangwa n'uruziga rufite umuzenguruko utukura n'ubuso bwera kirimo imodoka n'ipikipiki (C3) gisobanura ko ikinyabiziga cyose gifite moteri kibujijwe kuhanyura. Igisubizo cy'ukuri ni A (b)).",
        "memoryTip": "Uruziga rutukura rurimo imodoka na moto = Birabujijwe ku binyabiziga byose bya moteri."
    },
    240: {
        "lawTitle": "Ingingo ya 90: Icyapa A2 - Umuhanda Utaringaniye (Cassis ou Dos-d'âne)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo ibinogo bibiri cyangwa akatuba kimenyesha: UMUHANDA UTARINGANIYE (route déformée cyangwa dos d'âne). Ugomba kugabanya umuvuduko kugira ngo wirinde kwangiza imodoka cyangwa guta umuvuno. Igisubizo cy'ukuri ni B (Umuhanda utaringaniye).",
        "memoryTip": "Mpandeshatu irimo imifuka/udutuba = Umuhanda utaringaniye."
    },
    241: {
        "lawTitle": "Ingingo ya 90: Icyapa A22 - Umuyaga w'Intambike (Vent latéral)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura gishushanyijeho umuseke w'umuyaga (manche à air) kimenyesha: UMUYAGA W'INTAMBIKE ushobora guhirika cyangwa guta imodoka mu mukoki. Igisubizo cy'ukuri ni A (Umuyaga w'intambike).",
        "memoryTip": "Icyapa kirimo umuseke w'umuyaga = Umuyaga w'intambike ukaze."
    },
    242: {
        "lawTitle": "Ingingo ya 101: Icyapa F6 - Iherezo ry'Umuhanda Urombereje",
        "lawDetails": "Icyapa cy'urukiramende rw'ubururu ruriho ikimenyetso cy'umuhanda urombereje giciyemo umurongo utukura ucuramye (F6) gisobanura: IHEREZO RY'UMUHANDA UROMBEJE W'IBICE BYINSHI (Fin d'autoroute). Igisubizo cy'ukuri ni B.",
        "memoryTip": "Icyapa cy'umuhanda urombeje kirimo umurongo utukura ucuramye = Iherezo ryawo."
    },
    243: {
        "lawTitle": "Ingingo ya 90: Icyapa A7 - Ifungana ry'Umuhanda (Chaussée rétrécie)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru n'umuzenguruko utukura kirimo imirongo ibiri yegera hagati kimenyesha: IFUNGANA RY'UMUHANDA (Chaussée rétrécie). Ugomba kugabanya umuvuduko no kwitegura kubisikana witonze. Igisubizo cy'ukuri ni C (Ifungana ry'umuhanda).",
        "memoryTip": "Imirongo yegera hagati muri mpandeshatu = Ifungana ry'umuhanda."
    },
    244: {
        "lawTitle": "Ingingo ya 102: Icyapa E14 - Inzira Idakomeza (Impasse)",
        "lawDetails": "Icyapa cy'urukiramende rw'ubururu rurimo umurongo w'umweru ufite agashami gatukura hejuru gisobanura: INZIRA IDAKOMEZA cyangwa Umuhanda w'impumyi (Impasse). Ushobora kwinjiramo ariko nta handi usohokera uretse guhindukira. Igisubizo cy'ukuri ni B (Inzira idakomeza).",
        "memoryTip": "Umurongo wera ufite agasanduku gatukura hejuru = Inzira idakomeza (Impasse)."
    },
    246: {
        "lawTitle": "Ingingo ya 92: Icyapa B2a - STOP (Guhagarara Burundu)",
        "lawDetails": "Iyo umuyobozi abonye icyapa cya STOP (ishusho y'imfuruka umunani 'octogone' ifite ubuso butukura n'inyandiko ya STOP mu ibara ryera), ategetswe: GUHAGARARA BURUNDU ku murongo wo guhagarara n'iyo nta kindi kinyabiziga yaba abona giturutse ahandi. Igisubizo cy'ukuri ni B (Guhagarara niyo nta kinyabiziga ubona).",
        "memoryTip": "Icyapa cya STOP kigutegeka guhagarara burundu n'iyo nta kindi kinyabiziga kigaragara."
    },
    247: {
        "lawTitle": "Ingingo ya 90: Icyapa A16 - Uguhinguka ku Mwaro cyangwa Inkombe",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru n'umuzenguruko utukura kirimo imodoka igwa mu mazi kimenyesha: UGUHINGUKA KU MWARO CYANGWA KU NKOMBE Y'AMAZI CYANGWA AHEGEREYE ICYOME. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Imodoka igwa mu mazi muri mpandeshatu = Uguhinguka ku nkombe cyangwa icyome."
    },
    249: {
        "lawTitle": "Ingingo ya 92: Ishusho y'Icyapa Gitanga Uburenganzira bwo Gutambuka Mbere (B4)",
        "lawDetails": "Icyapa cy'umuhanda ufite uburenganzira bwo gutambuka mbere (B4 / Route prioritaire) kigira ishusho ya MPANDESHAMBIRI (losange / carré sur pointe) ifite umugongo w'umweru, ubuso bw'umuhondo n'uruzitiro rw'umweru. Igisubizo cy'ukuri ni A (b)).",
        "memoryTip": "Icyapa cya priorité ni mpandeshambiri (losange) ifite ubuso bw'umuhondo."
    },
    250: {
        "lawTitle": "Ingingo ya 90: Icyapa A17 - Ahegereye Inzira ya Gari ya Moshi Ibambiye",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo ishusho y'uruzitiro (barrière) kimenyesha: AHEGEREYE AMASANGANO Y'INZIRA NYABAGENDWA N'INZIRA YA GARI YA MOSHI IBAMBIYE (Passage à niveau avec barrières). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Uruzitiro muri mpandeshatu = Inzira ya gari ya moshi ibambiye."
    },
    251: {
        "lawTitle": "Ingingo ya 90: Icyapa A13 - Akamanuko Gashobora Gutera Ibyago (Descente)",
        "lawDetails": "Icyapa cya mpandeshatu kirimo imodoka imanuka n'ikigereranyo cy'ijana (urugero 10%) kimenyesha: AGACURI KATEZA IBYAGO (Descente dangereuse). Ugomba gushyiramo vitese ifata imodoka (frein moteur) ukirinda gufata feri y'ikirenge umwanya muremure. Igisubizo cy'ukuri ni B (Agacuri kateza ibyago).",
        "memoryTip": "Imodoka imanuka 10% = Agacuri kateza ibyago (Descente dangereuse)."
    },
    252: {
        "lawTitle": "Ingingo ya 102: Icyapa E14 - Umuhanda Udakomeza",
        "lawDetails": "Icyapa cy'urukiramende rw'ubururu kigaragaza inzira ifunze n'akarongo gatukura hejuru gisobanura: UMUHANDA UDAKOMEZA (Impasse). Igisubizo cy'ukuri ni B (Umuhanda udakomeza).",
        "memoryTip": "Inzira ifite agasanduku gatukura hejuru ku buso bw'ubururu = Umuhanda udakomeza."
    },
    257: {
        "lawTitle": "Ingingo ya 90: Icyapa A24 - Ukugendera mu Muhanda Ubisikanirwamo",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo utwambi tubiri dutandukanye mu cyerekezo (kamwe kazamuka akandi kamanuka) kimenyesha: UKUGENDERA MU MUHANDA UBISIKANIRWAMO (Circulation dans les deux sens). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Utwambi tubiri dutandukanye muri mpandeshatu = Umuhanda ubisikanirwamo."
    },
    259: {
        "lawTitle": "Ingingo ya 90: Icyapa A25 - Ahegereye Icyago Kidasobanuye Ukundi",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo akamenyetso ko gutangara (!) kimenyesha: AHEGEREYE ICYAGO KIDASOBANUYE UKUNDI. Kenshi kiba gifite icyapa cy'inyongera munsi gisobanura neza icyo cyago. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Akamenyetso ko gutangara (!) muri mpandeshatu = Icyago kidasobanuye ukundi."
    },
    260: {
        "lawTitle": "Ingingo ya 90: Icyapa A18 - Inzira ya Gari ya Moshi Itabambiye",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru n'umuzenguruko utukura kirimo imashini ya gari ya moshi icumba umwotsi kimenyesha: AHEGEREYE AMASANGANO Y'INZIRA YA GARI YA MOSHI HATABAMBIYE (Passage à niveau sans barrières). Ugomba kwitonda cyane no kwitegura guhagarara. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Imashini icumba umwotsi muri mpandeshatu = Gari ya moshi itabambiye."
    },
    261: {
        "lawTitle": "Ingingo ya 92: Impamvu yo Gushyiraho Icyapa cya STOP mu Masangano",
        "lawDetails": "Icyapa cya STOP gishyirwa mu masangano igihe kureba no kubona neza ibinyabiziga biri mu muhanda munini biruhije (visibilité insuffisante), kugira ngo umuyobozi ahagarare burundu yitegereze mbere yo kwinjira mu muhanda. Igisubizo cy'ukuri ni A (Biragoye kubona neza mu muhanda munini).",
        "memoryTip": "STOP ishyirwa mu masangano aho kubona neza ibinyabiziga biruhije."
    },
    274: {
        "lawTitle": "Ingingo ya 102: Icyapa E1 - Ahari Ibitaro (Hôpital)",
        "lawDetails": "Icyapa cy'urukiramende rw'ubururu kirimo inyuguti ya H n'igitanda cy'umweru gisobanura: AHARI IBITARO (Hôpital). Umuyobozi asabwa kwirinda kuvuza amahoni no kugabanya umuvuduko muri ako gace. Igisubizo cy'ukuri ni B (Ibitaro).",
        "memoryTip": "Inyuguti H n'igitanda ku cyapa cy'ubururu = Ibitaro."
    },
    278: {
        "lawTitle": "Ingingo ya 106: Amatara Amurika yo mu Muhanda",
        "lawDetails": "Iyo itara ritukura ryaka cyangwa itara ry'umuhondo ridafite akambi ryaka mu masangano, umuyobozi abujijwe gukomeza urugendo. Igisubizo cy'ukuri ni D (Oya - ntiwemerewe gukomeza).",
        "memoryTip": "Itara ritukura cyangwa ry'umuhondo rihagarika ibinyabiziga."
    },
    281: {
        "lawTitle": "Ingingo ya 90: Icyapa A8 - Utubuye Dutaruka mu Muhanda",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru n'umuzenguruko utukura kirimo imodoka igendera ku tubuye dutaruka kimenyesha: UTUBUYE DUTARUKA MU MUHANDA (Projections de gravillons). Ugomba kugabanya umuvuduko no kwitarura ibindi binyabiziga kugira ngo ibirahuri bitameneka. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Imodoka itara amabuye muri mpandeshatu = Utubuye dutaruka mu muhanda."
    },
    304: {
        "lawTitle": "Ingingo ya 10: Umutekano w'Abana mu Muhanda",
        "lawDetails": "Iyo umuyobozi yegereye umwana utwaye akagare k'abana cyangwa uri ku nkengero z'umuhanda, agomba kwitegura guhagarara no kureka umwana agatambuka, kuko abana bashobora kwinjira mu muhanda bitunguranye batitaye ku binyabiziga. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Abana bafatwa nk'abadafite amakenga; itegure guhagarara ubareke batambuke."
    },
    305: {
        "lawTitle": "Ingingo ya 15: Uburenganzira bwo Gutambuka",
        "lawDetails": "Iyo ikinyabiziga kiri mu muhanda munini ugenzurwa n'icyapa cya priorité cyangwa giturutse iburyo mu masangano adafite ibyapa, kiba gifite uburenganzira bwo gukomeza urugendo rwacyo witonze. Igisubizo cy'ukuri ni A (Umuyobozi w'ikinyabiziga agomba gukomeza).",
        "memoryTip": "Iyo ufite uburenganzira bwo gutambuka (priorité), urakomeza ariko witonze."
    },
    310: {
        "lawTitle": "Ingingo ya 38: Imiparikiro Mibi Ibangamira Umuhanda",
        "lawDetails": "Ibinyabiziga biparitse mu buryo bufunze inzira y'abanyamaguru cyangwa bibangamiye urujya n'uruza rw'abandi byombi biba bihagaze nabi mu mategeko y'umuhanda. Igisubizo cy'ukuri ni A (Ibinyabiziga byombi).",
        "memoryTip": "Guhagarara ku nzira y'abanyamaguru cyangwa mu ikoni ni amakosa abangamira umutekano."
    },
    311: {
        "lawTitle": "Ingingo ya 26: Kunyura ku Munyegare mu Murongo Ucagaguye",
        "lawDetails": "Kunyura ku munyegare byemewe mu gihe ushobora kurenga umurongo wera ucagaguye mu mutekano nta kindi kinyabiziga kiguturutse imbere, ukamusigira nibura metero 1 y'umwanya w'umutekano. Igisubizo cy'ukuri ni C (Arenze umurongo wera ucagaguye).",
        "memoryTip": "Umurongo ucagaguye urarengwa mu gihe cyo kunyuranaho nta kaga."
    },
    313: {
        "lawTitle": "Ingingo ya 106: Itara ry'Umuhondo Ridakonje (Feu jaune fixe)",
        "lawDetails": "Itara ry'umuhondo ridakonje rivuga ko ugomba GUHAGARARA mbere y'umurongo wo guhagararaho, kereka gusa iyo uhagaze wateza impanuka kubera kwegera cyane umurongo mu buryo budashoboka guhagarara neza. Igisubizo cy'ukuri ni C (Hagarara niba utateza ibyago).",
        "memoryTip": "Itara ry'umuhondo = Hagarara niba ugifite umwanya uhagije wo kubikora nta kaga."
    },
    314: {
        "lawTitle": "Ingingo ya 20: Gutwara Inyuma y'Ikinyamitende",
        "lawDetails": "Iyo ukurikiye ikinyamitende (ipikipiki cyangwa igare), ugomba kuzirikana ko bishobora guhagarara cyangwa gukatira mu muhanda bitunguranye, bityo ugomba gusiga intera ihagije y'umutekano. Igisubizo cy'ukuri ni D (Umuyobozi w'ikinyamitende ashobora guhagarara bitunguranye).",
        "memoryTip": "Ibinyamitende bishobora guhagarara bitunguranye; siga intera ihagije y'umutekano."
    },
    315: {
        "lawTitle": "Ingingo ya 40: Kureka Abanyamaguru Bambuka Iyo Ukata",
        "lawDetails": "Iyo ukata iburyo cyangwa ibumoso winjira mu wundi muhanda, ugomba guhagarara ukareka abanyamaguru bari kwambuka uwo muhanda winjiramo bagatambuka mbere. Igisubizo cy'ukuri ni C (Guhagarara akareka abanyamaguru bakambuka).",
        "memoryTip": "Ugiye gukata ikoni areka abanyamaguru bari kwambuka uwo muhanda winjiramo."
    },
    317: {
        "lawTitle": "Ingingo ya 40: Inzira y'Abanyamaguru (Passage pour piétons)",
        "lawDetails": "Iyo ugeze ku nzira y'abanyamaguru cyangwa hari abanyamaguru batangiye kwambuka, itegeko rigutegeka kubareka bakambuka mu mahoro kuko bafite uburenganzira busesuye bwo gutambuka mbere y'ibinyabiziga. Igisubizo cy'ukuri ni A (Kwemerera abanyamaguru kwambuka umuhanda).",
        "memoryTip": "Abanyamaguru bari ku nzira yabagenewe bafite uburenganzira busesuye bwo gutambuka."
    },
    318: {
        "lawTitle": "Ingingo ya 30: Imyiteguro yo Gukata Ikoni ry'Iburyo",
        "lawDetails": "Iyo ugiye gukata iburyo uva mu muhanda munini ujya mu muto, ugomba kwegera cyane inkengero y'iburyo bw'umuhanda mbere yo gukata (Ikinyabiziga cya mbere kiri mu buryo bwiza). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Gukata iburyo bisaba kwegera cyane uruhande rw'iburyo bw'umuhanda mbere yo gukata."
    },
    323: {
        "lawTitle": "Ingingo ya 28: Inshingano z'Umunyuzweho (Véhicule dépassé)",
        "lawDetails": "Iyo undi muyobozi yatangiye kukunyuraho, utegetswe kwegera iburyo kandi NTWONGERE UMUVUDUKO (ukomezanya umuvuduko warufite cyangwa ukawugabanya gato kugira ngo anyureho vuba). Igisubizo cy'ukuri ni A (Gukomezanya umuvuduko warufite).",
        "memoryTip": "Iyo undi agunyuraho, ntugomba na rimwe kongera umuvuduko; komezanya umuvuduko usanzwe."
    },
    325: {
        "lawTitle": "Ingingo ya 106: Amatara Adakora mu Masangano",
        "lawDetails": "Iyo amatara agenga amasangano adakora (azize umuriro cyangwa yapfuye), amasangano ahinduka asanzwe akurikiza itegeko rya PRIORITÉ À DROITE (gutambuka k'uturutse iburyo), abayobozi bakagendana ubwitonzi bwinshi. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Amatara nadakora, kurikiza amategeko yo gutambuka kw'iburyo n'ubwitonzi bukabije."
    },
    326: {
        "lawTitle": "Ingingo ya 11: Guhura n'Amatungo mu Nzira Nyabagendwa",
        "lawDetails": "Iyo uhuye n'ishyo ry'amatungo mu muhanda, ugomba kugabanya umuvuduko, kwirinda kuvuza ihembe (honi) kuko byayakangaza bikirukira mu modoka, ugatambukana ubwitonzi bwinshi. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Amatungo mu muhanda = Gabanya umuvuduko, ntukavuze ihoni."
    },
    329: {
        "lawTitle": "Ingingo ya 25: Kubisikana mu Nzira Ifunganye",
        "lawDetails": "Iyo ugeze ahantu hafunganye kandi uhuye n'ikindi kinyabiziga, ugomba kugabanya umuvuduko no gusiga umwanya uhagije hagati yanyu cyangwa ugahagarara niba ari wowe ufite inzitizi ku ruhande rwawe. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Mu nzira ifunganye gabanya umuvuduko kandi usige umwanya uhagije wo kubisikana."
    },
    330: {
        "lawTitle": "Ingingo ya 20: Intera y'Umutekano Inyuma y'Ibindi Binyabiziga",
        "lawDetails": "Iyo ugendera inyuma y'ikindi kinyabiziga udateganya kukinyuraho, ugomba gusiga intera ihagije ituma ibindi binyabiziga bishaka kunyuranaho bishobora kwinjira hagati yanyu nta kaga. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Siga intera ihagije ituma undi unyuranaho abona aho yinjira mu mutekano."
    },
    332: {
        "lawTitle": "Ingingo ya 29: Gutanga Ibimenyetso Hakiri Kare (Clignotant)",
        "lawDetails": "Gutinda gutanga ikimenyetso cyo gukata cyangwa guhagarara bibangamira abandi bakoresha umuhanda kuko bituma batabona igihe gihagije cyo kwitegura no gufata ingamba zikwiriye. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Tanga ikimenyetso cyo gukata hakiri kare mbere yo guhindura icyerekezo."
    },
    334: {
        "lawTitle": "Ingingo ya 86: Ibyo Gukora Igihe habaye Impanuka Idakomeye",
        "lawDetails": "Iyo habaye impanuka nta muntu wakomeretse kandi ibinyabiziga bibangamiye urujya n'uruza, abashoferi bagomba gushushanya aho ibiziga byari biri bakabikura mu muhanda bakabyegereza ku ruhande kugira ngo badahagarika umuhanda. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Shushanya aho imodoka zangiritse zari ziri hanyuma uzikure mu muhanda."
    },
    335: {
        "lawTitle": "Ingingo ya 31: Gukata Ibumoso mu Muhanda w'Icyerekezo Kimwe",
        "lawDetails": "Mu muhanda w'icyerekezo kimwe (sens unique), umuyobozi ushaka gukata ibumoso agomba kwegera inkengero y'ibumoso bw'umuhanda mbere yo gukata. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Sens unique: Gukata ibumoso bisaba kwegera cyane inkengero y'ibumoso."
    },
    336: {
        "lawTitle": "Ingingo ya 16: Kugendera mu Ruhande rw'Iburyo",
        "lawDetails": "Mu muhanda w'ibyerekezo bibiri, umuyobozi agomba kugendera mu ruhande rw'iburyo gusa, akegera ibumoso gusa igihe anyuranaho cyangwa agiye gukata ibumoso. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Gendera mu gisate cy'iburyo keretse ugiye kunyuranaho cyangwa gukata ibumoso."
    },
    337: {
        "lawTitle": "Ingingo ya 101: Kugendera mu Muhanda Urombereje w'Ibisate Byinshi",
        "lawDetails": "Mu muhanda urombereje ugizwe n'ibisate byinshi, umuyobozi agomba kugendera mu gisate cy'iburyo cyane, ibindi bisate by'ibumoso bikoreshwa mu gihe cyo kunyuranaho gusa. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Mu muhanda w'ibisate byinshi, igisate cy'iburyo nicyo kigenderwamo mu buryo busanzwe."
    },
    339: {
        "lawTitle": "Ingingo ya 32: Kwinjira mu Masangano Azunguruka (Rond-point)",
        "lawDetails": "Kwinjira mu masangano azunguruka bikorerwa IBURYO (mu cyerekezo kinyuranye n'icy'intambwe z'isaha / sens giratoire). Igisubizo cy'ukuri ni D (Iburyo).",
        "memoryTip": "Muri rond-point hinjirirwa iburyo ukazenguruka ukataza ibumoso."
    },
    340: {
        "lawTitle": "Ingingo ya 31: Imyiteguro yo Gukata Ibumoso mu Muhanda w'Ibyerekezo Bibiri",
        "lawDetails": "Mbere yo gukata ibumoso mu muhanda w'ibyerekezo bibiri, umuyobozi agomba kwegereza ikinyabiziga cye umurongo ugabanya umuhanda mo kabiri (gusa iburyo bwo hagati mu muhanda) adarenze umurongo. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Kuri ibyerekezo bibiri, egereza ikinyabiziga umurongo wo hagati utawurenze."
    },
    341: {
        "lawTitle": "Ingingo ya 32: Kwitondera Ibinyabiziga Biri Muri Rond-point",
        "lawDetails": "Mbere yo kwinjira mu masangano azunguruka, umuyobozi agomba kureba ibinyabiziga biturutse ibumoso bwe biri imbere muri rond-point, umuvuduko bifite n'intera iri hagati yabo kuko aribyo bifite uburenganzira mbere ye. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Reba ibumoso mbere yo kwinjira muri rond-point kuko ibirimo bifite priorité."
    },
    342: {
        "lawTitle": "Ingingo ya 26: Kunyuranaho ku Kinyabiziga Gitwara Abagenzi Gihagaze",
        "lawDetails": "Iyo ikinyabiziga gitwara abagenzi gihagaze ku cyicaro cyacyo gishyiramo abantu, ushobora kukinyuraho uciye ibumoso bwayo witonze kandi ukitegura guhagarara kuko abagenzi bashobora kwambuka umuhanda bitunguranye. Igisubizo cy'ukuri ni A (Kunyuranaho ibumoso).",
        "memoryTip": "Kunyuranaho ku modoka y'abagenzi ihagaze bikorerwa ibumoso n'ubwitonzi bukabije."
    },
    347: {
        "lawTitle": "Ingingo ya 40: Abanyamaguru Bategereje Kwambuka",
        "lawDetails": "Iyo ugeze ku nzira y'abanyamaguru ukabona abanyamaguru bahagaze ku ruhande bategereje kwambuka, ugomba kugabanya umuvuduko ukihangana ukabareka bakambuka mbere yo gukomeza urugendo. Igisubizo cy'ukuri ni B (Kwihangana ugategereza).",
        "memoryTip": "Iyo abanyamaguru bategereje kwambuka, gabanya umuvuduko ubahe inzira."
    },
    350: {
        "lawTitle": "Ingingo ya 48: Amatara yo Guhagarara Nijoro ku Nkengero",
        "lawDetails": "Iyo ikinyabiziga gihagaze ku nkengero z'umuhanda nijoro ahatabona neza, amatara yo guhagarara umwanya munini (feux de position / stationnement) agomba kuguma yaka kugira ngo kigaragare ku bandi bakoresha umuhanda. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Guhagarara nijoro ahatabona bisaba amatara yo guhagarara akaguma yaka."
    },
    351: {
        "lawTitle": "Ingingo ya 28: Kutanyuranaho Iyo Undi Yatangiye Kukunyuraho",
        "lawDetails": "Iyo umuyobozi ukuri inyuma yatangiye kukunyuraho, ntiwemerewe na gato nawe gutangira kunyuranaho ku wundi uri imbere yawe kuko byateza impanuka ikomeye. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Iyo umuntu yatangiye kukunyuraho, wowe ubujijwe gutangira kunyura ku wundi."
    },
    358: {
        "lawTitle": "Ingingo ya 46: Gutwara mu Mvura Nyinshi n'Ibihu",
        "lawDetails": "Mu gihe cy'imvura nyinshi, ibihu bikaze cyangwa umukungugu, ugomba kugabanya umuvuduko cyane kandi ugacana amatara yo kubona aho ujya (feux de croisement / code) n'amatara kamenabihu (feux de brouillard). Igisubizo cy'ukuri ni B.",
        "memoryTip": "Mu bihu n'imvura nyinshi: Gabanya umuvuduko uce amatara magufi (code)."
    },
    359: {
        "lawTitle": "Ingingo ya 96: Ibyapa Bitegeka n'Ibimenyetso Byabyo",
        "lawDetails": "Ibyapa bitegeka bikozwe mu ishusho y'uruziga rufite ubuso bw'ubururu n'ikirango cy'umweru. Naho ibifite umuzenguruko utukura biba ari ibyapa bibuza. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Ibyapa bitegeka bigira ishusho y'uruziga."
    },
    364: {
        "lawTitle": "Ingingo ya 90: Icyapa cy'Umuhanda Ubisikanirwamo (A24)",
        "lawDetails": "Icyapa kimenyesha kugendera mu muhanda ubisikanirwamo kirangwa n'ishusho ya mpandeshatu ifite umuzenguruko utukura, ubuso bwera n'ikirango cy'utwambi tubiri tw'umukara tureba mu byerekezo binyuranye (kamwe kazamuka akandi kamanuka). Igisubizo cy'ukuri ni B.",
        "memoryTip": "Mpandeshatu yera irimo utwambi tubiri tw'umukara = Umuhanda ubisikanirwamo."
    },
    366: {
        "lawTitle": "Ingingo ya 90: Ibyapa byo mu Muhanda",
        "lawDetails": "Iki cyapa kigaragaza amabwiriza yihariye yo mu muhanda. Kubera ko nta gisubizo cy'ukuri kiboneka mu mahitamo A, B, na C, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Soma neza amategeko agenga iki cyapa kugira ngo uhitemo neza."
    },
    368: {
        "lawTitle": "Ingingo ya 76: Ibara ry'Utugarurarumuri tw'Imbere",
        "lawDetails": "Utugarurarumuri turi ku ruhande rw'imbere rw'ikinyabiziga tugomba kuba dusa n'umweru (catadioptres blancs), kugira ngo tutitiranywa n'utw'inyuma dutukura. Igisubizo cy'ukuri ni C (N'umweru).",
        "memoryTip": "Utugarurarumuri tw'imbere ni umweru, utw'inyuma ni umutuku."
    },
    370: {
        "lawTitle": "Ingingo ya 90: Ishusho n'Ubuso by'Ibyapa Biburira",
        "lawDetails": "Ibyapa biburira ibyago bigizwe n'ishusho ya mpandeshatu ifite umuzenguruko utukura n'ubuso bw'ibara ryera (A). Igisubizo cy'ukuri ni C (Ishusho mpandeshatu, ubuso umweru).",
        "memoryTip": "Ibyapa biburira = Mpandeshatu ifite ubuso bwera n'umuzenguruko utukura."
    },
    371: {
        "lawTitle": "Ingingo ya 90: Icyapa cy'Ifungana ry'Umuhanda (A7b)",
        "lawDetails": "Icyapa kigaragaza umurongo ugororotse n'undi uheta ugana hagati ibumoso gisobanura: IFUNGANA RY'UMUHANDA W'AKAYIRA GASATIRA UMUHANDA IBUMOSO (Chaussée rétrécie par la gauche). Igisubizo cy'ukuri ni B.",
        "memoryTip": "Umurongo w'ibumoso wegera hagati = Ifungana ry'umuhanda riturutse ibumoso."
    },
    373: {
        "lawTitle": "Ingingo ya 90: Ibyapa by'Ibyago n'Imirongo",
        "lawDetails": "Iki cyapa kirangwa n'amabwiriza yihariye y'amategeko y'umuhanda. Kubera ko ibisobanuro bihabanye n'amahitamo yatanzwe muri A, B, na C, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Reba neza ibimenyetso biri ku cyapa mbere yo guhitamo."
    },
    375: {
        "lawTitle": "Ingingo ya 90: Ibyapa by'Umuhanda",
        "lawDetails": "Iki cyapa gisobanura amabwiriza yo mu muhanda. Kubera ko amahitamo A, B, C arimo amakosa ku bisobanuro by'itegeko, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Iyo nta gisubizo cyujuje ibisabwa mu mahitamo, hitamo D."
    },
    376: {
        "lawTitle": "Ingingo ya 90: Icyapa A1a - Ikoni ry'Iburyo (Virage à droite)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo umurongo w'umukara uhese ugana iburyo gisobanura: IKONI RY'IBURYO (Virage dangereux à droite). Igisubizo cy'ukuri ni A (Ikoni iburyo).",
        "memoryTip": "Mpandeshatu irimo umuheto ugana iburyo = Ikoni ribi ry'iburyo."
    },
    377: {
        "lawTitle": "Ingingo ya 16: Umuhanda w'Ibisate Bibiri n'Ibyerekezo Bibiri",
        "lawDetails": "Iyo umuhanda ugabanijwemo ibisate bibiri ugendwamo mu byerekezo byombi, umuyobozi abujijwe kugendera mu gisate cy'ibumoso bidasobanutse kuko icyo gisate kigenewe abaturutse mu cyerekezo kinyuranye. Igisubizo cy'ukuri ni C (Kugendera mu gisate cy'ibumoso).",
        "memoryTip": "Ntugomba kugendera mu gisate cy'ibumoso mu muhanda ubisikanirwamo."
    },
    378: {
        "lawTitle": "Ingingo ya 90: Ibiranga Icyapa cy'Umuhanda Ubisikanirwamo (A24)",
        "lawDetails": "Icyapa kimenyesha kugendera mu muhanda ubisikanirwamo kigizwe n'ishusho ya mpandeshatu mu ibara ritukura, ubuso bwera n'ikirango cy'umukara kigaragaza utwambi tubiri. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Mpandeshatu itukura, ubuso bwera n'ikirango cy'umukara = Icyapa A24."
    },
    379: {
        "lawTitle": "Ingingo ya 96: Icyapa Cyerekana Inzira y'Amatungo",
        "lawDetails": "Icyapa kigaragaza ahegereye amatungo kirangwa n'ishusho ya mpandeshatu ifite ubuso bw'umweru n'ishusho y'inka mu ibara ry'umukara n'umuzenguruko utukura. Igisubizo cy'ukuri ni D.",
        "memoryTip": "Ishusho y'inka mu mpandeshatu = Akayira k'amatungo."
    },
    380: {
        "lawTitle": "Ingingo ya 94: Icyapa C17 - Kubuza Kuvumuza Amahembe (Honi)",
        "lawDetails": "Icyapa kibuza kuvuza ihembe ry'ikinyabiziga (interdiction d'user d'avertisseurs sonores) kirangwa n'ishusho y'uruziga rufite umuzenguruko utukura, ubuso bw'umweru n'ikirango cy'ihembe ry'umukara riciyemo umurongo utukura ucuramye. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Uruziga rurimo ihembe riciyemo umurongo utukura = Birabujijwe kuvuza ihoni."
    },
    381: {
        "lawTitle": "Ingingo ya 90: Ibiranga Ibyapa Biburira Ibyago",
        "lawDetails": "Ibyapa biburira ibyago birangwa n'ishusho ya mpandeshatu ifite umuzenguruko mu ibara ritukura, ubuso mu ibara ryera n'ikiranga mu ibara ry'umukara. Igisubizo cy'ukuri ni A.",
        "memoryTip": "Mpandeshatu itukura + ubuso bwera + ikirango cy'umukara = Ibyapa biburira."
    },
    382: {
        "lawTitle": "Ingingo ya 95: Aho Ibyapa Bibuza n'Ibitegeka Bikurikizwa",
        "lawDetails": "Ibyapa bibuza n'ibitegeka bikurikizwa gusa ku ruhande rw'umuhanda bishinzweho kuva aho bishinzwe kugeza ku nkomane ikurikiyeho. Kubera ko amahitamo A, B, na C atatanze ibi bisobanuro byuzuye, igisubizo cy'ukuri ni D (Nta gisubizo cy'ukuri kirimo).",
        "memoryTip": "Ibyapa bibuza/bitegeka bireba uruhande bishinzweho gusa kugeza ku masangano akurikiyeho."
    },
    383: {
        "lawTitle": "Ingingo ya 90: Intego y'Ibyapa Biburira (Signaux de danger)",
        "lawDetails": "Ibyapa biburira bishyirwaho kugira ngo bimenyeshe abagenzi KO HARI ICYAGO KIRI IMBERE mu muhanda, kugira ngo bafate ingamba zo kugabanya umuvuduko no kwitonda hakiri kare. Igisubizo cy'ukuri ni A (Ko hari icyago).",
        "memoryTip": "Ibyapa biburira intego yabyo ni ukumenyesha ko hari icyago imbere."
    },
    384: {
        "lawTitle": "Ingingo ya 105: Umumaro w'Ibyapa by'Inyongera (Panneaux additionnels)",
        "lawDetails": "Ibyapa by'inyongera bishyirwa munsi y'ibyapa bikuru kugira ngo byerekane intera, uburebure, amoko y'ibinyabiziga birebwa n'icyo cyapa, cyangwa amabwiriza n'amarengayobora yihariye. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Ibyapa by'inyongera bitanga amabwiriza yihariye cyangwa amakuru yongera ku cyapa gikuru."
    },
    385: {
        "lawTitle": "Ingingo ya 96: Ishusho y'Icyapa cyo Gukikira Gitegetswe (D1)",
        "lawDetails": "Icyapa cyo gukikira gitegetswe (contournement obligatoire - D1) kigizwe n'ishusho y'URUZIGA rw'ubururu rurimo akambi k'umweru gahese gakikira inzitizi. Igisubizo cy'ukuri ni B (Uruziga).",
        "memoryTip": "Ugukikira gitegetswe ni icyapa cy'uruziga rw'ubururu (D1)."
    },
    386: {
        "lawTitle": "Ingingo ya 96: Amabara y'Icyapa cy'Icyerekezo Gitegetswe (D1a)",
        "lawDetails": "Icyapa kivuga icyerekezo gitegetswe kigizwe n'ubuso bw'ibara ry'ubururu n'ikirango cy'akambi mu ibara ryera (C. Ubururu n'ikirango cy'umweru). Igisubizo cy'ukuri ni C.",
        "memoryTip": "Icyerekezo gitegetswe = Ubuso bw'ubururu n'ikirango cy'umweru."
    },
    391: {
        "lawTitle": "Ingingo ya 94: Icyapa C4 - Kubuza Imodoka Zifite Uburemere Burenga Igipimo",
        "lawDetails": "Icyapa cy'uruziga rutukura kirimo ikamyo n'inyandiko ya 5t kireba gusa ibinyabiziga bipima toni 5 no kuzamura. Ku mushoferi w'ivatiri (imodoka nto ipima munsi ya toni 3.5), iki cyapa ntacyo kimurebaho ashobora gukomeza urugendo. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Icyapa kibuza amakamyo > 5t ntikireba imodoka nto (ivatiri)."
    },
    392: {
        "lawTitle": "Ingingo ya 94: Icyapa C11a - Kubuza Gukata Iburyo",
        "lawDetails": "Iyo mu masangano hari icyapa kibuza gukata iburyo (uruziga rutukura rurimo akambi gakikira iburyo gaciwemo umurongo utukura), ntibyemewe gukata iburyo n'iyo waba utabona ikindi kinyabiziga. Igisubizo cy'ukuri ni C (Ntabwo byemewe).",
        "memoryTip": "Akambi kerekeza iburyo gaciwemo umurongo utukura = Birabujijwe gukata iburyo."
    },
    393: {
        "lawTitle": "Ingingo ya 107: Itara ry'Umutuku Rimyatsa ku Nzira ya Gari ya Moshi",
        "lawDetails": "Iyo ugeze ku masangano y'inzira ya gari ya moshi ukabona itara ry'umutuku rimyatsa (feu rouge clignotant), ugomba GUHAGARARA BURUNDU munsi y'iryo tara kuko biba bivuze ko gari ya moshi iri kwegera. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Itara ry'umutuku rimyatsa kuri gari ya moshi = Hagarara burundu."
    },
    397: {
        "lawTitle": "Ingingo ya 15: Uburenganzira bwo Gutambuka Iyo Ukata Ibumoso",
        "lawDetails": "Iyo ushaka gukata ibumoso mu masangano, ugomba guhagarara ukareka ikinyabiziga kiguturutse imbere kikugana mu murongo ugororotse (imodoka y'icyatsi) kigatambuka mbere yawe. Igisubizo cy'ukuri ni B (Imodoka y'icyatsi ifite uburenganzira).",
        "memoryTip": "Ugikata ibumoso areka ikinyabiziga giturutse imbere mu murongo ugororotse kigatambuka mbere."
    },
    398: {
        "lawTitle": "Ingingo ya 15: Priorité mu Masangano Agengwa n'Ibyapa",
        "lawDetails": "Uburenganzira bwo gutambuka muri iri sangano biterwa n'aho ugana n'icyapa kigenga uwo muhanda; niba ufite icyapa kigutegeka gutanga inzira (B1) ugomba kureka abandi bagatambuka, niba uri mu muhanda mukuru uratambuka. Igisubizo cy'ukuri ni C (Yego, bitewe n'aho ngana).",
        "memoryTip": "Kora ibihuje n'icyapa kiri ku ruhande rwawe n'aho werekeza."
    },
    400: {
        "lawTitle": "Ingingo ya 26: Kunyuranaho Iyo Uwo Mbere Agiye Gukata Ibumoso",
        "lawDetails": "Iyo umuyobozi w'imbere yatanze ikimenyetso cyo gukata ibumoso kandi akegereza ikinyabiziga cye hagati mu muhanda, umuyobozi umukurikiye ashobora kumunyuraho amuciye IBURYO cyangwa amuciye ibumoso igihe yabonye umwanya uhagije. Igisubizo cy'ukuri ni C.",
        "memoryTip": "Iyo uwo mbere agiye gukata ibumoso, umunyuraho witonze."
    },
    401: {
        "lawTitle": "Ingingo ya 94: Ibyapa C13 na C14 - Ibibuzwa Byerekanywe ku Byapa",
        "lawDetails": "Ibyapa bibiri byerekanywe bibuza: (1) kunyuranaho ku binyabiziga bifite imitende irenze ibiri (C13), no (2) kurenza umuvuduko wa 70 km/h (C14). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Kunyuranaho kubujijwe + Umuvuduko ntarengwa wa 70 km/h."
    },
    410: {
        "lawTitle": "Ingingo ya 94: Icyapa C16 - Birabujijwe Guhindukira (Demi-tour interdit)",
        "lawDetails": "Icyapa cy'uruziga rufite umuzenguruko utukura kirimo akambi gakora uruziga gahindukira gaciyemo umurongo utukura ucuramye gisobanura: BIRABUJIJWE GUHINDUKIRA (Demi-tour interdit). Igisubizo cy'ukuri ni A (Birabujijwe guhindukira).",
        "memoryTip": "Akambi gahindukira gaciwemo umurongo utukura = Birabujijwe guhindukira."
    },
    412: {
        "lawTitle": "Ingingo ya 94: Icyapa C18 - Birabujijwe Guhagarara Umwanya Munini (Stationnement interdit)",
        "lawDetails": "Icyapa cy'uruziga rufite umuzenguruko utukura n'ubuso bw'ubururu buciwemo umurongo umwe utukura ucuramye gisobanura: BIRABUJIJWE GUHAGARARA UMWANYA MUNINI (Stationnement interdit). Guhagarara akanya gato gusa nibyo byemewe. Igisubizo cy'ukuri ni B.",
        "memoryTip": "Umurongo umwe utukura ucuramye = Guhagarara akanya kanini birabujijwe."
    },
    416: {
        "lawTitle": "Ingingo ya 90: Icyapa A24 - Ukugendera mu Muhanda Ubisikanirwamo",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo utwambi tubiri dutandukanye mu cyerekezo kimenyesha: UKUGENDERA MU MUHANDA UBISIKANIRWAMO (Circulation dans les deux sens). Igisubizo cy'ukuri ni D.",
        "memoryTip": "Utwambi tubiri dutandukanye muri mpandeshatu = Umuhanda ubisikanirwamo."
    },
    417: {
        "lawTitle": "Ingingo ya 90: Icyapa A13 - Akamanuko Gashobora Gutera Ibyago (Descente)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo imodoka imanuka cyangwa ikimenyetso cy'ijana (10%) kimenyesha: AKAMANUKO GASHOBORA GUTERA IBYAGO (Descente dangereuse). Igisubizo cy'ukuri ni B.",
        "memoryTip": "Imodoka imanuka = Akamanuko gashobora gutera ibyago."
    },
    418: {
        "lawTitle": "Ingingo ya 90: Icyapa A14 - Akazamuko Gashinze Cyane (Montée à forte inclinaison)",
        "lawDetails": "Icyapa cya mpandeshatu kirimo imodoka izamuka umusozi gihanitse kimenyesha: AKAZAMUKO GASHINZE CYANE (Montée à forte pente). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Imodoka izamuka = Akazamuko gashinze cyane."
    },
    419: {
        "lawTitle": "Ingingo ya 90: Icyapa A6 - Umuhanda Unyerera (Chaussée glissante)",
        "lawDetails": "Icyapa cya mpandeshatu y'umweru ifite umuzenguruko utukura kirimo imodoka itakaza uburinganire inyerera gisobanura: UMUHANDA UNYERERA (Chaussée glissante). Igisubizo cy'ukuri ni D.",
        "memoryTip": "Imodoka inyerera muri mpandeshatu = Umuhanda unyerera."
    },
    421: {
        "lawTitle": "Ingingo ya 90: Icyapa A15 - Akayira k'Amatungo (Passage d'animaux domestiques)",
        "lawDetails": "Icyapa cya mpandeshatu ifite umuzenguruko utukura kirimo ishusho y'inka y'umukara kimenyesha: AKAYIRA K'AMATUNGO cyangwa ahegereye amatungo yambukiranya umuhanda. Igisubizo cy'ukuri ni D (Akayira k'amatungo).",
        "memoryTip": "Ishusho y'inka muri mpandeshatu = Akayira k'amatungo."
    },
    422: {
        "lawTitle": "Ingingo ya 102: Icyapa E14 - Umuhanda Udakomeza (Impasse)",
        "lawDetails": "Mu byapa byo mu muhanda, icyapa kigaragaza umuhanda udakomeza (impasse) ni ICYAPA E14, kirangwa n'urukiramende rw'ubururu rurimo umurongo w'umweru ufite agasanduku gatukura hejuru. Igisubizo cy'ukuri ni B (Icyapa E14).",
        "memoryTip": "Icyapa E14 = Umuhanda udakomeza (Impasse)."
    },
    424: {
        "lawTitle": "Ingingo ya 92: Icyapa B6 - Gutambuka Mbere ku Binyabiziga Biturutse Imbere",
        "lawDetails": "Icyapa cyerekana ko umuyobozi ukibonye afite uburenganzira bwo gutambuka mbere y'abaturutse aho agana mu nzira ifunganye ni ICYAPA B6 (urukiramende rw'ubururu rurimo akambi k'umweru gakomeza n'akambi gatukura gato kagasatira). Igisubizo cy'ukuri ni A (Icyapa B6).",
        "memoryTip": "Icyapa B6 (akambi kera gakomeza) = Ufite uburenganzira bwo gutambuka mbere."
    },
    427: {
        "lawTitle": "Ingingo ya 102: Icyapa E13a - Umuhanda w'Icyerekezo Kimwe (Sens unique)",
        "lawDetails": "Icyapa cyerekana umuhanda w'icyerekezo kimwe ni ICYAPA E13a (ishusho y'urukiramende cyangwa kare y'ubururu irimo akambi kinini k'umweru kareba hejuru). Igisubizo cy'ukuri ni B (Icyapa E13a).",
        "memoryTip": "Icyapa E13a (akambi kera kareba hejuru ku buso bw'ubururu) = Umuhanda w'icyerekezo kimwe."
    },
    428: {
        "lawTitle": "Ingingo ya 90: Ibyapa byo mu Muhanda",
        "lawDetails": "Iki cyapa kirangwa n'amabwiriza yihariye y'amategeko y'umuhanda. Kubera ko nta mahitamo muri A, B, na C agaragaza ibisobanuro by'ukuri by'iki cyapa, igisubizo cy'ukuri ni D (Nta gisubizo kirimo).",
        "memoryTip": "Iyo ibisobanuro by'icyapa bitari mu mahitamo yabanje, igisubizo kiba D."
    },
    429: {
        "lawTitle": "Ingingo ya 101: Icyapa F6 - Iherezo ry'Umuhanda Urombeje",
        "lawDetails": "Icyapa cy'urukiramende rw'ubururu ruriho ikimenyetso cy'umuhanda urombeje w'ibice byinshi giciyemo umurongo utukura ucuramye gisobanura: IHEREZO RY'UMUHANDA UROMBEJE W'IBICE BYINSHI (Fin de route pour automobiles / autoroute). Igisubizo cy'ukuri ni A.",
        "memoryTip": "Umurongo utukura uciye ku cyapa cy'umuhanda urombeje = Iherezo ryawo."
    }
}

updated_count = 0
for item in data:
    num = item.get("number")
    if num in enhancements:
        enh = enhancements[num]
        item["lawTitle"] = enh["lawTitle"]
        item["lawDetails"] = enh["lawDetails"]
        item["memoryTip"] = enh["memoryTip"]
        updated_count += 1

with open(EXPLANATIONS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Successfully updated {updated_count} explanations in {EXPLANATIONS_PATH}")
