import { Category, Question, CategoryType, Difficulty } from '@/types/game';

// Helper function to create questions
function q(
  id: string, 
  category: CategoryType, 
  difficulty: Difficulty, 
  question: string, 
  answers: string[], 
  correct: number,
  explanation?: string
): Question {
  return { 
    id, 
    category, 
    difficulty, 
    type: 'multiple_choice',
    question, 
    answers, 
    correct,
    explanation 
  };
}

function qTF(
  id: string,
  category: CategoryType,
  difficulty: Difficulty,
  question: string,
  isTrue: boolean,
  explanation?: string
): Question {
  return {
    id,
    category,
    difficulty,
    type: 'true_false',
    question,
    answers: ['Igaz', 'Hamis'],
    correct: isTrue ? 0 : 1,
    explanation
  };
}

function qSort(
  id: string,
  category: CategoryType,
  difficulty: Difficulty,
  question: string,
  orderedItems: string[],
  explanation?: string
): Question {
  return {
    id,
    category,
    difficulty,
    type: 'sorting',
    question,
    answers: orderedItems, // Correct order
    correct: orderedItems, // Correct order
    explanation
  };
}

export const categories: Category[] = [
  {
    id: 'history',
    name: 'Történelem',
    questions: [
      qSort('h_sort1', 'history', 'medium', 'Rendezd időrendbe az eseményeket!', ['Honfoglalás', 'Tatárjárás', 'Mohácsi vész', 'Rákóczi-szabadságharc']),
      qTF('h_tf1', 'history', 'easy', 'Mátyás királyt 1458-ban koronázták meg.', true),
      qTF('h_tf2', 'history', 'medium', 'A mohácsi vész 1541-ben volt.', false),
      q('h1', 'history', 'easy', 'Mikor volt a mohácsi csata?', ['1456', '1526', '1552', '1686'], 1),
      q('h2', 'history', 'easy', 'Ki volt Magyarország első királya?', ['Géza fejedelem', 'Szent István', 'Szent László', 'Könyves Kálmán'], 1),
      q('h3', 'history', 'easy', 'Mikor volt a magyar szabadságharc?', ['1789-1790', '1848-1849', '1867-1868', '1918-1919'], 1),
      q('h4', 'history', 'easy', 'Ki volt Hunyadi János?', ['Király', 'Hadvezér', 'Püspök', 'Költő'], 1),
      q('h5', 'history', 'medium', 'Mikor alapították Budapestet?', ['1849', '1867', '1873', '1896'], 2),
      q('h6', 'history', 'easy', 'Melyik hónapban volt az 1956-os forradalom?', ['Október', 'November', 'Szeptember', 'December'], 0),
      q('h7', 'history', 'medium', 'Ki volt Mátyás király felesége?', ['Beatrix', 'Erzsébet', 'Mária', 'Anna'], 0),
      q('h8', 'history', 'medium', 'Mikor volt a kiegyezés?', ['1848', '1867', '1873', '1896'], 1),
      q('h9', 'history', 'hard', 'Hol volt Rákóczi Ferenc székhelye?', ['Buda', 'Eger', 'Munkács', 'Sárospatak'], 2),
      q('h10', 'history', 'easy', 'Mikor csatlakozott Magyarország az EU-hoz?', ['1999', '2004', '2007', '2010'], 1),
      q('h11', 'history', 'medium', 'Ki volt a Hunyadiak őse?', ['Vajk', 'Zsigmond', 'Serbe', 'Géza'], 2),
      q('h12', 'history', 'hard', 'Melyik évben halt meg Mátyás király?', ['1485', '1490', '1495', '1500'], 1),
      q('h13', 'history', 'easy', 'Ki írta a Himnuszt?', ['Petőfi Sándor', 'Kölcsey Ferenc', 'Arany János', 'Vörösmarty'], 1),
      q('h14', 'history', 'medium', 'Mikor volt a tatárjárás?', ['1141-42', '1241-42', '1341-42', '1441-42'], 1),
      q('h15', 'history', 'hard', 'Ki volt az utolsó Árpád-házi király?', ['III. András', 'IV. Béla', 'V. István', 'IV. László'], 0),
      q('h16', 'history', 'easy', 'Mikor volt a trianoni békeszerződés?', ['1918', '1919', '1920', '1921'], 2),
      q('h17', 'history', 'medium', 'Ki volt Bem József?', ['Magyar tábornok', 'Lengyel tábornok', 'Osztrák tábornok', 'Orosz tábornok'], 1),
      q('h18', 'history', 'hard', 'Melyik évben koronázták meg I. Ferencz Józsefet?', ['1848', '1867', '1873', '1896'], 1),
      q('h19', 'history', 'medium', 'Ki volt Széchenyi István?', ['Király', 'Költő', 'Reformer', 'Hadvezér'], 2),
      q('h20', 'history', 'easy', 'Mikor ért véget a második világháború?', ['1944', '1945', '1946', '1947'], 1),
    ]
  },
  {
    id: 'geography',
    name: 'Földrajz',
    questions: [
      q('g1', 'geography', 'easy', 'Mi Magyarország legmagasabb pontja?', ['Galya-tető', 'Kékes', 'Dobogó-kő', 'Csóványos'], 1),
      qTF('g_tf1', 'geography', 'easy', 'A Balaton Közép-Európa legnagyobb tava.', true),
      qTF('g_tf2', 'geography', 'medium', 'Pécs nagyobb város, mint Debrecen.', false),
      q('g2', 'geography', 'easy', 'Melyik a legnagyobb magyar tó?', ['Velencei-tó', 'Fertő tó', 'Balaton', 'Tisza-tó'], 2),
      q('g3', 'geography', 'medium', 'Hány megyéje van Magyarországnak?', ['17', '19', '21', '23'], 1),
      q('g4', 'geography', 'easy', 'Melyik folyó a leghosszabb Magyarországon?', ['Duna', 'Tisza', 'Dráva', 'Rába'], 0),
      q('g5', 'geography', 'medium', 'Mi Magyarország második legnagyobb városa?', ['Miskolc', 'Szeged', 'Debrecen', 'Pécs'], 2),
      q('g6', 'geography', 'easy', 'Melyik országnak NINCS közös határa Magyarországgal?', ['Románia', 'Lengyelország', 'Szerbia', 'Ausztria'], 1),
      q('g7', 'geography', 'easy', 'Hol található a Hortobágy?', ['Alföld', 'Dunántúl', 'Északi-középhegység', 'Kisalföld'], 0),
      q('g8', 'geography', 'medium', 'Melyik városban van a Pannonhalmi Főapátság?', ['Győr', 'Pannonhalma', 'Esztergom', 'Veszprém'], 1),
      q('g9', 'geography', 'hard', 'Mi a Tisza legnagyobb mellékfolyója?', ['Körös', 'Maros', 'Sajó', 'Zagyva'], 1),
      q('g10', 'geography', 'medium', 'Melyik hegységben található a Baradla-barlang?', ['Bükk', 'Mátra', 'Aggtelek', 'Mecsek'], 2),
      q('g11', 'geography', 'easy', 'Mi a világ legnagyobb óceánja?', ['Atlanti', 'Indiai', 'Csendes', 'Jeges'], 2),
      q('g12', 'geography', 'medium', 'Melyik a világ leghosszabb folyója?', ['Amazonas', 'Nílus', 'Jangce', 'Mississippi'], 1),
      q('g13', 'geography', 'easy', 'Mi Franciaország fővárosa?', ['London', 'Berlin', 'Párizs', 'Madrid'], 2),
      q('g14', 'geography', 'hard', 'Melyik a világ legmélyebb tava?', ['Kaszpi-tenger', 'Bajkál-tó', 'Tanganyika', 'Malawi'], 1),
      q('g15', 'geography', 'medium', 'Hány kontinens van a Földön?', ['5', '6', '7', '8'], 2),
      q('g16', 'geography', 'easy', 'Melyik országban van a Mount Everest?', ['India', 'Kína', 'Nepál', 'Tibet'], 2),
      q('g17', 'geography', 'medium', 'Mi Ausztrália fővárosa?', ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], 2),
      q('g18', 'geography', 'hard', 'Melyik a világ legnagyobb szigete?', ['Madagaszkár', 'Grönland', 'Borneó', 'Új-Guinea'], 1),
      q('g19', 'geography', 'easy', 'Melyik folyó folyik át Budapesten?', ['Tisza', 'Duna', 'Dráva', 'Rába'], 1),
      q('g20', 'geography', 'medium', 'Hány szomszédja van Magyarországnak?', ['5', '6', '7', '8'], 2),
    ]
  },
  {
    id: 'science',
    name: 'Tudomány',
    questions: [
      q('s1', 'science', 'easy', 'Ki találta fel a golyóstollat?', ['Rubik Ernő', 'Bíró László', 'Kandó Kálmán', 'Puskás Tivadar'], 1),
      qTF('s_tf1', 'science', 'easy', 'A víz 100 fokon forr tengerszinten.', true),
      qTF('s_tf2', 'science', 'medium', 'A Nap egy bolygó.', false),
      q('s2', 'science', 'easy', 'Mi a víz kémiai képlete?', ['CO2', 'H2O', 'NaCl', 'O2'], 1),
      q('s3', 'science', 'medium', 'Hány csontból áll a felnőtt emberi test?', ['106', '156', '206', '256'], 2),
      q('s4', 'science', 'easy', 'Melyik bolygó a legnagyobb a Naprendszerben?', ['Mars', 'Szaturnusz', 'Jupiter', 'Uránusz'], 2),
      q('s5', 'science', 'hard', 'Mi a fény sebessége km/s-ban?', ['200 000', '300 000', '400 000', '500 000'], 1),
      q('s6', 'science', 'medium', 'Ki fedezte fel a penicillint?', ['Pasteur', 'Fleming', 'Koch', 'Semmelweis'], 1),
      q('s7', 'science', 'hard', 'Hány elem van a periódusos rendszerben?', ['92', '108', '118', '126'], 2),
      q('s8', 'science', 'easy', 'Mi az emberi test legnagyobb szerve?', ['Máj', 'Bőr', 'Tüdő', 'Agy'], 1),
      q('s9', 'science', 'medium', 'Ki találta fel a távbeszélőt?', ['Edison', 'Bell', 'Marconi', 'Tesla'], 1),
      q('s10', 'science', 'medium', 'Hány kromoszómája van az embernek?', ['23', '46', '48', '64'], 1),
      q('s11', 'science', 'easy', 'Mi a Nap?', ['Bolygó', 'Csillag', 'Hold', 'Üstökös'], 1),
      q('s12', 'science', 'medium', 'Ki fogalmazta meg a relativitáselméletet?', ['Newton', 'Einstein', 'Hawking', 'Bohr'], 1),
      q('s13', 'science', 'hard', 'Mi az arany vegyjele?', ['Ag', 'Au', 'Ar', 'Al'], 1),
      q('s14', 'science', 'easy', 'Hány fog van egy felnőtt embernek?', ['28', '30', '32', '34'], 2),
      q('s15', 'science', 'medium', 'Mi a DNS rövidítés?', ['Dezoxiribonukleinsav', 'Dinamikus nukleinsav', 'Direkt neutronsav', 'Dihidrogén-szulfát'], 0),
      q('s16', 'science', 'easy', 'Hány bolygó van a Naprendszerben?', ['7', '8', '9', '10'], 1),
      q('s17', 'science', 'hard', 'Ki találta fel a dinamitot?', ['Nobel', 'Edison', 'Watt', 'Volta'], 0),
      q('s18', 'science', 'medium', 'Mi a levegő fő összetevője?', ['Oxigén', 'Nitrogén', 'Szén-dioxid', 'Argon'], 1),
      q('s19', 'science', 'easy', 'Hány lába van a póknak?', ['6', '8', '10', '12'], 1),
      q('s20', 'science', 'medium', 'Mi az abszolút nulla fok Celsiusban?', ['-173°C', '-273°C', '-373°C', '-473°C'], 1),
    ]
  },
  {
    id: 'sport',
    name: 'Sport',
    questions: [
      q('sp1', 'sport', 'easy', 'Hány játékos van egy focicsapatban?', ['9', '10', '11', '12'], 2),
      q('sp2', 'sport', 'easy', 'Ki volt az Aranycsapat kapitánya?', ['Puskás Ferenc', 'Kocsis Sándor', 'Bozsik József', 'Hidegkuti'], 0),
      q('sp3', 'sport', 'medium', 'Hányszor nyert Magyarország olimpiai aranyat vízilabdában?', ['7', '9', '11', '13'], 1),
      q('sp4', 'sport', 'easy', 'Hány pontos a tökéletes bowling játék?', ['200', '250', '300', '350'], 2),
      q('sp5', 'sport', 'medium', 'Ki nyerte a legtöbb Tour de France-t?', ['Armstrong', 'Indurain', 'Merckx', 'Froome'], 0),
      q('sp6', 'sport', 'easy', 'Hány szettet kell nyerni teniszben Grand Slam döntőben (férfi)?', ['2', '3', '4', '5'], 1),
      q('sp7', 'sport', 'hard', 'Melyik évben volt az első modern olimpia?', ['1892', '1896', '1900', '1904'], 1),
      q('sp8', 'sport', 'medium', 'Hány méter egy maratoni futás?', ['40 195', '41 195', '42 195', '43 195'], 2),
      q('sp9', 'sport', 'easy', 'Mi a kosárlabda gyűrű magassága?', ['2.80 m', '3.05 m', '3.20 m', '3.50 m'], 1),
      q('sp10', 'sport', 'medium', 'Melyik ország nyerte a legtöbb foci VB-t?', ['Németország', 'Argentína', 'Brazília', 'Olaszország'], 2),
      q('sp11', 'sport', 'easy', 'Hány játékos van egy röplabda csapatban?', ['5', '6', '7', '8'], 1),
      q('sp12', 'sport', 'hard', 'Ki tartja a 100m futás világrekordját?', ['Bolt', 'Gay', 'Powell', 'Blake'], 0),
      q('sp13', 'sport', 'medium', 'Melyik sportban használnak puck-ot?', ['Gyeplabda', 'Jégkorong', 'Lacrosse', 'Curling'], 1),
      q('sp14', 'sport', 'easy', 'Hány karika van az olimpiai zászlón?', ['4', '5', '6', '7'], 1),
      q('sp15', 'sport', 'medium', 'Melyik magyar úszó nyert 3 aranyat egy olimpián?', ['Egerszegi', 'Hosszú', 'Darnyi', 'Czene'], 1),
      q('sp16', 'sport', 'hard', 'Hány Grand Slam címe van Roger Federernek?', ['17', '18', '19', '20'], 3),
      q('sp17', 'sport', 'easy', 'Mi a gól neve a jégkorongban?', ['Pont', 'Gól', 'Találat', 'Kosár'], 1),
      q('sp18', 'sport', 'medium', 'Melyik országból származik a sumo?', ['Kína', 'Korea', 'Japán', 'Mongólia'], 2),
      q('sp19', 'sport', 'easy', 'Hány félidőből áll egy focimeccs?', ['2', '3', '4', '5'], 0),
      q('sp20', 'sport', 'medium', 'Mi a Formula 1 leggyorsabb pályája?', ['Monaco', 'Monza', 'Spa', 'Silverstone'], 1),
    ]
  },
  {
    id: 'culture',
    name: 'Kultúra & Művészet',
    questions: [
      q('cu1', 'culture', 'easy', 'Ki festette a Mona Lisát?', ['Michelangelo', 'Da Vinci', 'Raffaello', 'Botticelli'], 1),
      q('cu2', 'culture', 'medium', 'Ki festette a Feszty-körképet?', ['Munkácsy', 'Feszty Árpád', 'Csontváry', 'Rippl-Rónai'], 1),
      q('cu3', 'culture', 'easy', 'Melyik múzeumban van a Mona Lisa?', ['British Museum', 'Louvre', 'Uffizi', 'Prado'], 1),
      q('cu4', 'culture', 'medium', 'Ki komponálta a Bánk bánt?', ['Liszt', 'Erkel Ferenc', 'Bartók', 'Kodály'], 1),
      q('cu5', 'culture', 'hard', 'Melyik évben épült a párizsi Eiffel-torony?', ['1879', '1889', '1899', '1909'], 1),
      q('cu6', 'culture', 'easy', 'Ki szobrászta a Dávidot?', ['Da Vinci', 'Michelangelo', 'Bernini', 'Donatello'], 1),
      q('cu7', 'culture', 'medium', 'Melyik stílus jellemző Gaudíra?', ['Barokk', 'Modernizmus', 'Reneszánsz', 'Gótika'], 1),
      q('cu8', 'culture', 'easy', 'Hol található a Sixtus-kápolna?', ['Firenze', 'Róma', 'Velence', 'Milánó'], 1),
      q('cu9', 'culture', 'hard', 'Ki tervezte a Sydney Operaházat?', ['Gehry', 'Utzon', 'Piano', 'Foster'], 1),
      q('cu10', 'culture', 'medium', 'Melyik festő vágta le a fülét?', ['Monet', 'Manet', 'Van Gogh', 'Cézanne'], 2),
      q('cu11', 'culture', 'easy', 'Mi a világ legnagyobb múzeuma?', ['Louvre', 'British Museum', 'Ermitázs', 'Met'], 0),
      q('cu12', 'culture', 'medium', 'Ki festette a Csillagos éjszakát?', ['Monet', 'Van Gogh', 'Renoir', 'Degas'], 1),
      q('cu13', 'culture', 'hard', 'Melyik évben készült el a Sagrada Família?', ['1882-ben kezdték', 'Még épül', '1926', '2010'], 1),
      q('cu14', 'culture', 'easy', 'Mi az impresszionizmus fő jellemzője?', ['Fény és szín', 'Geometria', 'Absztrakció', 'Realizmus'], 0),
      q('cu15', 'culture', 'medium', 'Ki volt Picasso?', ['Szobrász', 'Festő', 'Zenész', 'Író'], 1),
      q('cu16', 'culture', 'easy', 'Melyik országból származik a flamenco?', ['Portugália', 'Olaszország', 'Spanyolország', 'Franciaország'], 2),
      q('cu17', 'culture', 'hard', 'Ki tervezte a Guggenheim Múzeumot NY-ban?', ['Wright', 'Gehry', 'Mies', 'Corbusier'], 0),
      q('cu18', 'culture', 'medium', 'Mi a kubizmus?', ['Zenei stílus', 'Irodalmi műfaj', 'Festészeti irányzat', 'Építészet'], 2),
      q('cu19', 'culture', 'easy', 'Hol van a Vatikáni Múzeum?', ['Olaszország', 'Vatikán', 'Franciaország', 'Spanyolország'], 1),
      q('cu20', 'culture', 'medium', 'Ki festette az Utolsó vacsorát?', ['Raffaello', 'Da Vinci', 'Michelangelo', 'Tiziano'], 1),
    ]
  },
  {
    id: 'music',
    name: 'Zene',
    questions: [
      q('mu1', 'music', 'easy', 'Ki komponálta a Für Elisét?', ['Mozart', 'Beethoven', 'Bach', 'Chopin'], 1),
      q('mu2', 'music', 'easy', 'Melyik zenekar énekelte a Bohemian Rhapsodyt?', ['Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], 2),
      q('mu3', 'music', 'medium', 'Ki volt a Beatles dobosa?', ['John', 'Paul', 'George', 'Ringo'], 3),
      q('mu4', 'music', 'easy', 'Hány húrja van egy gitárnak?', ['4', '5', '6', '7'], 2),
      q('mu5', 'music', 'medium', 'Ki komponálta a Magyar rapszódiákat?', ['Bartók', 'Kodály', 'Liszt', 'Erkel'], 2),
      q('mu6', 'music', 'hard', 'Melyik évben halt meg Mozart?', ['1781', '1791', '1801', '1811'], 1),
      q('mu7', 'music', 'easy', 'Mi volt Elvis Presley beceneve?', ['A Király', 'A Főnök', 'A Legenda', 'A Sztár'], 0),
      q('mu8', 'music', 'medium', 'Hány szimfóniát írt Beethoven?', ['7', '8', '9', '10'], 2),
      q('mu9', 'music', 'easy', 'Melyik hangszer tartozik a vonósokhoz?', ['Trombita', 'Hegedű', 'Fuvola', 'Dob'], 1),
      q('mu10', 'music', 'hard', 'Ki volt Omega frontembere?', ['Benkő', 'Kóbor', 'Presser', 'Mihály'], 1),
      q('mu11', 'music', 'medium', 'Melyik ország szülöttje ABBA?', ['Norvégia', 'Dánia', 'Svédország', 'Finnország'], 2),
      q('mu12', 'music', 'easy', 'Ki énekelte a Thriller-t?', ['Prince', 'Michael Jackson', 'Stevie Wonder', 'James Brown'], 1),
      q('mu13', 'music', 'medium', 'Hány billentyű van egy zongorán?', ['76', '82', '88', '92'], 2),
      q('mu14', 'music', 'hard', 'Ki komponálta a Négy évszakot?', ['Bach', 'Vivaldi', 'Händel', 'Mozart'], 1),
      q('mu15', 'music', 'easy', 'Mi a rock and roll szülőhazája?', ['Anglia', 'USA', 'Jamaika', 'Ausztrália'], 1),
      q('mu16', 'music', 'medium', 'Melyik magyar énekes volt az LGT frontembere?', ['Bródy', 'Presser', 'Somló', 'Karácsony'], 1),
      q('mu17', 'music', 'easy', 'Hány tag volt a Spice Girlsben?', ['4', '5', '6', '7'], 1),
      q('mu18', 'music', 'hard', 'Melyik évben volt a Woodstock fesztivál?', ['1967', '1968', '1969', '1970'], 2),
      q('mu19', 'music', 'medium', 'Ki énekelte a "Purple Rain"-t?', ['Michael Jackson', 'Prince', 'Stevie Wonder', 'Lionel Richie'], 1),
      q('mu20', 'music', 'easy', 'Melyik hangszer a legnagyobb a zenekarban?', ['Cselló', 'Nagybőgő', 'Hárfa', 'Zongora'], 1),
    ]
  },
  {
    id: 'film',
    name: 'Film & TV',
    questions: [
      q('f1', 'film', 'easy', 'Ki rendezte a Titanicot?', ['Spielberg', 'Cameron', 'Scorsese', 'Nolan'], 1),
      q('f2', 'film', 'medium', 'Melyik magyar film nyert Oscar-díjat 2016-ban?', ['Testről és lélekről', 'Saul fia', 'Mindenki', 'Fehér Isten'], 1),
      q('f3', 'film', 'easy', 'Ki játszotta Harry Pottert?', ['Rupert Grint', 'Daniel Radcliffe', 'Tom Felton', 'Matthew Lewis'], 1),
      q('f4', 'film', 'medium', 'Hány Star Wars film van az eredeti trilógiában?', ['2', '3', '4', '5'], 1),
      q('f5', 'film', 'easy', 'Ki játszotta Jack Sparrow-t?', ['Orlando Bloom', 'Johnny Depp', 'Keira Knightley', 'Geoffrey Rush'], 1),
      q('f6', 'film', 'hard', 'Melyik évben jelent meg az első Hangya film?', ['1995', '1998', '2001', '2004'], 0),
      q('f7', 'film', 'medium', 'Ki rendezte a Keresztapa trilógiát?', ['Scorsese', 'Coppola', 'De Palma', 'Spielberg'], 1),
      q('f8', 'film', 'easy', 'Mi a Jóbarátok angol neve?', ['Buddies', 'Friends', 'Pals', 'Mates'], 1),
      q('f9', 'film', 'medium', 'Hány Oscar-díjat nyert a Titanic?', ['9', '10', '11', '12'], 2),
      q('f10', 'film', 'hard', 'Ki rendezte a 2001: Űrodüsszeiát?', ['Spielberg', 'Lucas', 'Kubrick', 'Scott'], 2),
      q('f11', 'film', 'easy', 'Mi a Marvel rövidítése?', ['MCU', 'MCA', 'MCC', 'MCE'], 0),
      q('f12', 'film', 'medium', 'Ki játszotta Forrest Gumpot?', ['Brad Pitt', 'Tom Hanks', 'Tom Cruise', 'Harrison Ford'], 1),
      q('f13', 'film', 'easy', 'Melyik sorozatban szerepel Walter White?', ['Breaking Bad', 'Better Call Saul', 'Ozark', 'Narcos'], 0),
      q('f14', 'film', 'hard', 'Hány Oscar-díjat nyert a Gyűrűk Ura: A király visszatér?', ['9', '10', '11', '12'], 2),
      q('f15', 'film', 'medium', 'Ki játszotta Jokert a Sötét Lovag-ban?', ['Jack Nicholson', 'Heath Ledger', 'Jared Leto', 'Joaquin Phoenix'], 1),
      q('f16', 'film', 'easy', 'Mi a Netflix eredeti országa?', ['Kanada', 'USA', 'UK', 'Ausztrália'], 1),
      q('f17', 'film', 'medium', 'Ki rendezte az Eredetet?', ['Cameron', 'Nolan', 'Fincher', 'Villeneuve'], 1),
      q('f18', 'film', 'hard', 'Melyik évben jelent meg az első James Bond film?', ['1958', '1962', '1966', '1970'], 1),
      q('f19', 'film', 'easy', 'Mi a Trónok harca angol címe?', ['Throne Games', 'Game of Thrones', 'Thrones War', 'King Games'], 1),
      q('f20', 'film', 'medium', 'Ki alakította Tony Starkot?', ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], 2),
    ]
  },
  {
    id: 'literature',
    name: 'Irodalom',
    questions: [
      q('l1', 'literature', 'easy', 'Ki írta Az ember tragédiáját?', ['Katona József', 'Madách Imre', 'Vörösmarty', 'Jókai Mór'], 1),
      q('l2', 'literature', 'easy', 'Ki írta a Hamletet?', ['Dickens', 'Shakespeare', 'Austen', 'Milton'], 1),
      q('l3', 'literature', 'medium', 'Ki írta az Egri csillagokat?', ['Jókai Mór', 'Gárdonyi Géza', 'Mikszáth', 'Móricz'], 1),
      q('l4', 'literature', 'easy', 'Mi Petőfi Sándor legismertebb verse?', ['Himnusz', 'Nemzeti dal', 'Szózat', 'Szeptember végén'], 1),
      q('l5', 'literature', 'hard', 'Melyik évben született Petőfi Sándor?', ['1813', '1817', '1823', '1827'], 2),
      q('l6', 'literature', 'medium', 'Ki írta a Pál utcai fiúkat?', ['Molnár Ferenc', 'Karinthy', 'Kosztolányi', 'Babits'], 0),
      q('l7', 'literature', 'easy', 'Ki írta a Harry Potter sorozatot?', ['Stephen King', 'J.K. Rowling', 'Dan Brown', 'John Grisham'], 1),
      q('l8', 'literature', 'medium', 'Ki írta a Bűn és bűnhődést?', ['Tolsztoj', 'Dosztojevszkij', 'Csehov', 'Gogol'], 1),
      q('l9', 'literature', 'hard', 'Melyik évben jelent meg az Ulysses?', ['1912', '1922', '1932', '1942'], 1),
      q('l10', 'literature', 'easy', 'Ki írta a Rómeó és Júliát?', ['Goethe', 'Shakespeare', 'Molière', 'Ibsen'], 1),
      q('l11', 'literature', 'medium', 'Ki írta A Gyűrűk Urát?', ['C.S. Lewis', 'J.R.R. Tolkien', 'Terry Pratchett', 'George R.R. Martin'], 1),
      q('l12', 'literature', 'easy', 'Mi Arany János legismertebb műve?', ['Toldi', 'Himnusz', 'Az ember tragédiája', 'Bánk bán'], 0),
      q('l13', 'literature', 'hard', 'Ki kapta az első irodalmi Nobel-díjat?', ['Tolsztoj', 'Sully Prudhomme', 'Kipling', 'Yeats'], 1),
      q('l14', 'literature', 'medium', 'Ki írta az 1984-et?', ['Huxley', 'Orwell', 'Bradbury', 'Vonnegut'], 1),
      q('l15', 'literature', 'easy', 'Mi a legismertebb Jókai regény?', ['A kőszívű ember fiai', 'Egri csillagok', 'Légy jó mindhalálig', 'A Pál utcai fiúk'], 0),
      q('l16', 'literature', 'medium', 'Ki írta a Don Quijotét?', ['Cervantes', 'Lope de Vega', 'Calderón', 'Góngora'], 0),
      q('l17', 'literature', 'hard', 'Hány magyar író kapott Nobel-díjat?', ['1', '2', '3', '4'], 0),
      q('l18', 'literature', 'easy', 'Ki írta a Szózatot?', ['Petőfi', 'Kölcsey', 'Vörösmarty', 'Arany'], 2),
      q('l19', 'literature', 'medium', 'Ki írta Az idő rövid történetét?', ['Einstein', 'Hawking', 'Sagan', 'Feynman'], 1),
      q('l20', 'literature', 'easy', 'Mi Móricz Zsigmond ismert regénye?', ['Légy jó mindhalálig', 'A kőszívű ember fiai', 'Egri csillagok', 'Tüskevár'], 0),
    ]
  },
  {
    id: 'nature',
    name: 'Természet & Állatok',
    questions: [
      q('n1', 'nature', 'easy', 'Mi a világ legnagyobb állata?', ['Elefánt', 'Kék bálna', 'Zsiráf', 'Fehér cápa'], 1),
      q('n2', 'nature', 'easy', 'Hány lába van a százlábúnak?', ['100', 'Változó', '50', '200'], 1),
      q('n3', 'nature', 'medium', 'Mi a világ leggyorsabb szárazföldi állata?', ['Gepárd', 'Oroszlán', 'Gazella', 'Strucc'], 0),
      q('n4', 'nature', 'easy', 'Melyik állat a "sivatag hajója"?', ['Kecske', 'Teve', 'Szamár', 'Ló'], 1),
      q('n5', 'nature', 'hard', 'Hány szíve van a polipnak?', ['1', '2', '3', '4'], 2),
      q('n6', 'nature', 'medium', 'Mi a világ legnagyobb virága?', ['Napraforgó', 'Rafflesia', 'Lótusz', 'Amaránt'], 1),
      q('n7', 'nature', 'easy', 'Melyik madár nem tud repülni?', ['Sas', 'Pingvin', 'Papagáj', 'Gólya'], 1),
      q('n8', 'nature', 'medium', 'Mi a világ legmérgezőbb kígyója?', ['Kobra', 'Taipán', 'Mamba', 'Vipera'], 1),
      q('n9', 'nature', 'easy', 'Hány évig él egy teknős?', ['20-30', '50-70', '100-150', '200+'], 2),
      q('n10', 'nature', 'hard', 'Melyik állat alszik a legtöbbet naponta?', ['Macska', 'Koala', 'Lajhár', 'Denevér'], 2),
      q('n11', 'nature', 'easy', 'Mi a legnagyobb macskafélé?', ['Oroszlán', 'Tigris', 'Leopárd', 'Jaguár'], 1),
      q('n12', 'nature', 'medium', 'Hány gyomra van a tehénnek?', ['1', '2', '3', '4'], 3),
      q('n13', 'nature', 'easy', 'Melyik állat készít mézet?', ['Darázs', 'Méh', 'Hangya', 'Lepke'], 1),
      q('n14', 'nature', 'hard', 'Mi a világ legnagyobb kétéltűje?', ['Óriásbéka', 'Kínai óriásszalamandra', 'Varangy', 'Axolotl'], 1),
      q('n15', 'nature', 'medium', 'Hány faj van a pókszabásúak között?', ['10 000', '25 000', '45 000', '100 000'], 2),
      q('n16', 'nature', 'easy', 'Mi a nemzeti madarunk?', ['Sas', 'Gólya', 'Túzok', 'Turul'], 3),
      q('n17', 'nature', 'medium', 'Melyik állat képes visszanöveszteni végtagjait?', ['Tengeri csillag', 'Polip', 'Rák', 'Mindegyik'], 3),
      q('n18', 'nature', 'hard', 'Hány foga van egy csigának?', ['0', '100-200', '1000-3000', '10000+'], 3),
      q('n19', 'nature', 'easy', 'Melyik állat a leghűségesebb?', ['Macska', 'Kutya', 'Papagáj', 'Ló'], 1),
      q('n20', 'nature', 'medium', 'Mi a legnagyobb rágcsáló?', ['Hód', 'Kapibara', 'Nutria', 'Mormota'], 1),
    ]
  },
  {
    id: 'food',
    name: 'Étel & Ital',
    questions: [
      q('fo1', 'food', 'easy', 'Mi Magyarország nemzeti étele?', ['Pörkölt', 'Gulyás', 'Halászlé', 'Töltött káposzta'], 1),
      q('fo2', 'food', 'easy', 'Melyik országból származik a pizza?', ['Spanyolország', 'Olaszország', 'Franciaország', 'Görögország'], 1),
      q('fo3', 'food', 'medium', 'Mi a wasabi?', ['Szószfajta', 'Japán torma', 'Hal', 'Tészta'], 1),
      q('fo4', 'food', 'easy', 'Melyik gyümölcsből készül a bor?', ['Alma', 'Körte', 'Szőlő', 'Barack'], 2),
      q('fo5', 'food', 'hard', 'Melyik országból származik a sushi?', ['Kína', 'Korea', 'Japán', 'Thaiföld'], 2),
      q('fo6', 'food', 'medium', 'Mi a pálinka alapanyaga?', ['Csak szőlő', 'Bármilyen gyümölcs', 'Csak barack', 'Gabona'], 1),
      q('fo7', 'food', 'easy', 'Melyik fűszer adja a curry sárga színét?', ['Sáfrány', 'Kurkuma', 'Gyömbér', 'Paprika'], 1),
      q('fo8', 'food', 'medium', 'Hány kalória van egy liter vízben?', ['0', '10', '50', '100'], 0),
      q('fo9', 'food', 'hard', 'Melyik országból származik a croissant?', ['Franciaország', 'Ausztria', 'Belgium', 'Svájc'], 1),
      q('fo10', 'food', 'easy', 'Mi a legdrágább fűszer?', ['Sáfrány', 'Vanília', 'Kardamom', 'Szegfűszeg'], 0),
      q('fo11', 'food', 'medium', 'Melyik italhoz használnak komlót?', ['Bor', 'Sör', 'Pálinka', 'Rum'], 1),
      q('fo12', 'food', 'easy', 'Melyik országból származik a hamburger?', ['Németország', 'USA', 'Anglia', 'Hollandia'], 1),
      q('fo13', 'food', 'hard', 'Mi a legrégebbi alkoholos ital?', ['Bor', 'Sör', 'Mézsör', 'Pálinka'], 2),
      q('fo14', 'food', 'medium', 'Melyik ételhez kell rántotta?', ['Carbonara', 'Bolognese', 'Alfredo', 'Puttanesca'], 0),
      q('fo15', 'food', 'easy', 'Mi a paprika magyar neve angolul?', ['Pepper', 'Paprika', 'Chili', 'Capsicum'], 1),
      q('fo16', 'food', 'medium', 'Melyik országból származik a tacos?', ['Spanyolország', 'Mexikó', 'Argentina', 'Peru'], 1),
      q('fo17', 'food', 'hard', 'Mi a világ legdrágább kávéja?', ['Jamaican Blue', 'Kopi Luwak', 'Hawaiian Kona', 'Geisha'], 1),
      q('fo18', 'food', 'easy', 'Melyik zöldségből készül a ketchup?', ['Répa', 'Paradicsom', 'Paprika', 'Padlizsán'], 1),
      q('fo19', 'food', 'medium', 'Mi a tonik fő összetevője?', ['Cukor', 'Kinin', 'Citrom', 'Menta'], 1),
      q('fo20', 'food', 'easy', 'Melyik országból származik a kávé?', ['Brazília', 'Kolumbia', 'Etiópia', 'Jemen'], 2),
    ]
  },
  {
    id: 'technology',
    name: 'Technológia',
    questions: [
      q('t1', 'technology', 'easy', 'Ki alapította a Microsoft-ot?', ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Jeff Bezos'], 1),
      q('t2', 'technology', 'easy', 'Mi az internet rövidítése?', ['WWW', 'HTML', 'URL', 'HTTP'], 0),
      q('t3', 'technology', 'medium', 'Melyik évben indult a Facebook?', ['2002', '2004', '2006', '2008'], 1),
      q('t4', 'technology', 'easy', 'Ki alapította az Apple-t?', ['Bill Gates', 'Steve Jobs', 'Elon Musk', 'Larry Page'], 1),
      q('t5', 'technology', 'hard', 'Mi volt az első programozási nyelv?', ['BASIC', 'FORTRAN', 'COBOL', 'Assembly'], 3),
      q('t6', 'technology', 'medium', 'Melyik cég készíti a PlayStation-t?', ['Microsoft', 'Nintendo', 'Sony', 'Sega'], 2),
      q('t7', 'technology', 'easy', 'Mi a Google fő terméke?', ['Keresőmotor', 'Email', 'Térkép', 'Videó'], 0),
      q('t8', 'technology', 'hard', 'Melyik évben találták fel a tranzisztort?', ['1937', '1947', '1957', '1967'], 1),
      q('t9', 'technology', 'medium', 'Ki alapította a Teslát?', ['Elon Musk', 'Martin Eberhard', 'Mindketten', 'Jeff Bezos'], 1),
      q('t10', 'technology', 'easy', 'Mi az Android?', ['Telefon', 'Operációs rendszer', 'Alkalmazás', 'Böngésző'], 1),
      q('t11', 'technology', 'medium', 'Melyik évben jelent meg az első iPhone?', ['2005', '2007', '2009', '2011'], 1),
      q('t12', 'technology', 'hard', 'Ki találta fel a World Wide Webet?', ['Vint Cerf', 'Tim Berners-Lee', 'Bob Kahn', 'Marc Andreessen'], 1),
      q('t13', 'technology', 'easy', 'Mi a RAM?', ['Tároló', 'Processzor', 'Memória', 'Videókártya'], 2),
      q('t14', 'technology', 'medium', 'Melyik cég készíti a Windows-t?', ['Apple', 'Google', 'Microsoft', 'IBM'], 2),
      q('t15', 'technology', 'hard', 'Mi volt az első keresőmotor?', ['Google', 'Yahoo', 'Archie', 'AltaVista'], 2),
      q('t16', 'technology', 'easy', 'Mi a Wi-Fi?', ['Vezeték nélküli internet', 'Kábel', 'Műhold', 'Telefon'], 0),
      q('t17', 'technology', 'medium', 'Melyik országból származik a Samsung?', ['Japán', 'Kína', 'Dél-Korea', 'Tajvan'], 2),
      q('t18', 'technology', 'hard', 'Melyik évben indult a YouTube?', ['2003', '2005', '2007', '2009'], 1),
      q('t19', 'technology', 'easy', 'Mi a PDF?', ['Képformátum', 'Dokumentumformátum', 'Videoformátum', 'Hangformátum'], 1),
      q('t20', 'technology', 'medium', 'Ki alapította az Amazont?', ['Elon Musk', 'Jeff Bezos', 'Larry Page', 'Mark Zuckerberg'], 1),
    ]
  },
  {
    id: 'politics',
    name: 'Politika',
    questions: [
      q('p1', 'politics', 'easy', 'Ki volt az USA első elnöke?', ['Lincoln', 'Jefferson', 'Washington', 'Adams'], 2),
      q('p2', 'politics', 'medium', 'Melyik évben omlott le a berlini fal?', ['1987', '1989', '1991', '1993'], 1),
      q('p3', 'politics', 'easy', 'Mi az ENSZ székhelye?', ['Genf', 'New York', 'Párizs', 'London'], 1),
      q('p4', 'politics', 'hard', 'Hány tagállama van az EU-nak (2024)?', ['25', '27', '29', '31'], 1),
      q('p5', 'politics', 'medium', 'Ki volt a Szovjetunió utolsó vezetője?', ['Brezsnyev', 'Andropov', 'Gorbacsov', 'Jelcin'], 2),
      q('p6', 'politics', 'easy', 'Mi a NATO?', ['Gazdasági szervezet', 'Katonai szövetség', 'ENSZ szerve', 'EU intézmény'], 1),
      q('p7', 'politics', 'medium', 'Melyik évben alakult meg az EU?', ['1989', '1993', '1999', '2004'], 1),
      q('p8', 'politics', 'hard', 'Ki volt az első női miniszterelnök?', ['Thatcher', 'Meir', 'Bandaranaike', 'Gandhi'], 2),
      q('p9', 'politics', 'easy', 'Mi Magyarország államformája?', ['Királyság', 'Köztársaság', 'Monarchia', 'Föderáció'], 1),
      q('p10', 'politics', 'medium', 'Hány évig tart egy amerikai elnöki ciklus?', ['3', '4', '5', '6'], 1),
      q('p11', 'politics', 'hard', 'Melyik évben lépett ki az UK az EU-ból?', ['2016', '2018', '2020', '2022'], 2),
      q('p12', 'politics', 'easy', 'Mi a demokrácia jelentése?', ['Egyeduralom', 'Népuralom', 'Katonai uralom', 'Vallási uralom'], 1),
      q('p13', 'politics', 'medium', 'Ki volt Nelson Mandela?', ['Zenész', 'Író', 'Politikus', 'Tudós'], 2),
      q('p14', 'politics', 'hard', 'Melyik országban van kétkamarás parlament?', ['Magyarország', 'USA', 'Kína', 'Észak-Korea'], 1),
      q('p15', 'politics', 'easy', 'Mi az Európai Parlament székhelye?', ['Brüsszel', 'Strasbourg', 'Luxembourg', 'Berlin'], 1),
      q('p16', 'politics', 'medium', 'Hány állandó tagja van az ENSZ BT-nek?', ['3', '4', '5', '7'], 2),
      q('p17', 'politics', 'hard', 'Melyik évben volt a kubai rakétaválság?', ['1959', '1962', '1965', '1968'], 1),
      q('p18', 'politics', 'easy', 'Ki volt Winston Churchill?', ['Király', 'Miniszterelnök', 'Tábornok', 'Elnök'], 1),
      q('p19', 'politics', 'medium', 'Mi a vétójog?', ['Egyetértés', 'Ellenszavazat', 'Tartózkodás', 'Távollét'], 1),
      q('p20', 'politics', 'easy', 'Hol van a Fehér Ház?', ['New York', 'Washington D.C.', 'Los Angeles', 'Chicago'], 1),
    ]
  },
  {
    id: 'economy',
    name: 'Gazdaság',
    questions: [
      q('e1', 'economy', 'easy', 'Mi a forint ISO kódja?', ['HUF', 'HUN', 'FT', 'MHF'], 0),
      q('e2', 'economy', 'medium', 'Melyik a világ legértékesebb cég (2024)?', ['Apple', 'Microsoft', 'Amazon', 'Google'], 0),
      q('e3', 'economy', 'easy', 'Mi az infláció?', ['Pénzérték növekedés', 'Pénzérték csökkenés', 'Kamatláb', 'Árfolyam'], 1),
      q('e4', 'economy', 'hard', 'Melyik évben volt a nagy gazdasági világválság?', ['1919', '1929', '1939', '1949'], 1),
      q('e5', 'economy', 'medium', 'Mi a GDP?', ['Bruttó hazai termék', 'Nemzeti jövedelem', 'Export', 'Import'], 0),
      q('e6', 'economy', 'easy', 'Melyik pénznem az euró jele?', ['$', '£', '€', '¥'], 2),
      q('e7', 'economy', 'hard', 'Melyik város a világ pénzügyi központja?', ['London', 'New York', 'Hongkong', 'Mindegyik'], 3),
      q('e8', 'economy', 'medium', 'Mi a részvény?', ['Hitel', 'Tulajdonrész', 'Kötvény', 'Biztosítás'], 1),
      q('e9', 'economy', 'easy', 'Mi a bank fő feladata?', ['Biztosítás', 'Pénzkezelés', 'Kereskedelem', 'Gyártás'], 1),
      q('e10', 'economy', 'medium', 'Mi a recesszió?', ['Gazdasági növekedés', 'Gazdasági visszaesés', 'Infláció', 'Defláció'], 1),
      q('e11', 'economy', 'hard', 'Melyik ország a világ legnagyobb exportőre?', ['USA', 'Kína', 'Németország', 'Japán'], 1),
      q('e12', 'economy', 'easy', 'Mi a Bitcoin?', ['Bank', 'Kriptovaluta', 'Részvény', 'Kötvény'], 1),
      q('e13', 'economy', 'medium', 'Mi az MNB?', ['Bank', 'Nemzeti Bank', 'Minisztérium', 'Tőzsde'], 1),
      q('e14', 'economy', 'hard', 'Melyik évben vezették be az eurót?', ['1995', '1999', '2002', '2004'], 1),
      q('e15', 'economy', 'easy', 'Mi a kamat?', ['Pénz ára', 'Adó', 'Bírság', 'Jutalom'], 0),
      q('e16', 'economy', 'medium', 'Mi a tőzsde?', ['Bank', 'Értékpapírpiac', 'Áruház', 'Hivatal'], 1),
      q('e17', 'economy', 'hard', 'Mi az OPEC?', ['Olajexportálók', 'Bankok', 'Autógyártók', 'Tech cégek'], 0),
      q('e18', 'economy', 'easy', 'Mi az ÁFA?', ['Jövedelemadó', 'Forgalmi adó', 'Vagyonadó', 'Útadó'], 1),
      q('e19', 'economy', 'medium', 'Ki a világ leggazdagabb embere (2024)?', ['Bezos', 'Musk', 'Gates', 'Buffett'], 1),
      q('e20', 'economy', 'easy', 'Mi a franchise?', ['Üzleti modell', 'Részvény', 'Hitel', 'Biztosítás'], 0),
    ]
  },
  {
    id: 'language',
    name: 'Nyelvtan & Szólások',
    questions: [
      q('la1', 'language', 'easy', 'Mi a főnév?', ['Cselekvés', 'Tárgy/személy neve', 'Tulajdonság', 'Szám'], 1),
      q('la2', 'language', 'medium', 'Mi a "Több is veszett Mohácsnál" jelentése?', ['Győzelem', 'Ne csüggedj', 'Vereség', 'Óvatosság'], 1),
      q('la3', 'language', 'easy', 'Hány magánhangzó van a magyar ABC-ben?', ['5', '9', '14', '18'], 2),
      q('la4', 'language', 'hard', 'Mi az alliteráció?', ['Rím', 'Hangismétlés', 'Túlzás', 'Ellentét'], 1),
      q('la5', 'language', 'medium', 'Mi a "Lassan járj, tovább érsz" tanulsága?', ['Sietség', 'Türelem', 'Kitartás', 'Erő'], 1),
      q('la6', 'language', 'easy', 'Mi az ige?', ['Cselekvés szava', 'Tárgy neve', 'Tulajdonság', 'Helyhatározó'], 0),
      q('la7', 'language', 'hard', 'Mi a metafora?', ['Hasonlat', 'Átvitt értelmű kifejezés', 'Túlzás', 'Ismétlés'], 1),
      q('la8', 'language', 'medium', 'Mi a "Nem zörög a haraszt" jelentése?', ['Csend', 'Van alapja', 'Hazugság', 'Titok'], 1),
      q('la9', 'language', 'easy', 'Mi a melléknév?', ['Cselekvés', 'Tulajdonság', 'Tárgy', 'Számláló'], 1),
      q('la10', 'language', 'hard', 'Mi az oximoron?', ['Ellentétes szavak', 'Hasonlat', 'Rím', 'Ismétlés'], 0),
      q('la11', 'language', 'medium', 'Mi a "Jobb ma egy veréb" folytatása?', ['mint holnap kettő', 'mint holnap egy túzok', 'mint soha', 'mint semmi'], 1),
      q('la12', 'language', 'easy', 'Hány betű van a magyar ABC-ben?', ['26', '33', '40', '44'], 3),
      q('la13', 'language', 'hard', 'Mi a palindróm?', ['Visszafelé is ugyanaz', 'Rím', 'Alliteráció', 'Metafora'], 0),
      q('la14', 'language', 'medium', 'Mi az "Amilyen az adjonisten" folytatása?', ['olyan a fogadjisten', 'olyan az ember', 'olyan a világ', 'olyan az élet'], 0),
      q('la15', 'language', 'easy', 'Mi a határozó?', ['Körülmény kifejezése', 'Tárgy neve', 'Tulajdonság', 'Cselekvés'], 0),
      q('la16', 'language', 'hard', 'Mi a szinesztézia?', ['Érzékelések keveredése', 'Túlzás', 'Ellentét', 'Ismétlés'], 0),
      q('la17', 'language', 'medium', 'Mi a "Siet, mint a hét meg a nyolc" jelentése?', ['Nagyon siet', 'Nem siet', 'Lassan megy', 'Áll'], 1),
      q('la18', 'language', 'easy', 'Mi a kérdőszó?', ['Ki, mi, hol', 'És, vagy', 'De, mert', 'A, az'], 0),
      q('la19', 'language', 'hard', 'Mi a pleonazmus?', ['Felesleges szóismétlés', 'Rövidítés', 'Kihagyás', 'Fordítás'], 0),
      q('la20', 'language', 'medium', 'Mi az "Aki korpa közé keveredik" folytatása?', ['megeszik a disznók', 'elázik', 'megég', 'eltűnik'], 0),
    ]
  },
  {
    id: 'mixed',
    name: 'Vegyes (Dupla pont!)',
    isBonus: true,
    questions: [
      q('m1', 'mixed', 'medium', 'Melyik magyar származású színész játszott a Star Trek-ben?', ['Lugosi Béla', 'Sátori Péter', 'Takei György', 'Nimoy Leonard'], 0),
      q('m2', 'mixed', 'easy', 'Hány Nobel-díjas magyar tudós van?', ['8', '13', '17', '21'], 1),
      q('m3', 'mixed', 'hard', 'Melyik évben volt az első magyar Grand Prix?', ['1986', '1988', '1990', '1992'], 0),
      q('m4', 'mixed', 'medium', 'Ki volt Neumann János?', ['Fizikus', 'Matematikus', 'Kémikus', 'Biológus'], 1),
      {
        id: 'm5_tf',
        category: 'mixed',
        difficulty: 'easy',
        type: 'true_false',
        question: 'A Balaton közép-Európa legnagyobb tava.',
        answers: ['Igaz', 'Hamis'],
        correct: 0, // Igaz (Assuming index 0 is Igaz)
        explanation: 'A Balaton Közép-Európa legnagyobb tava.'
      },
      {
        id: 'm6_est',
        category: 'mixed',
        difficulty: 'medium',
        type: 'estimation',
        question: 'Hány méter magas a Kékes?',
        answers: [], // Not used for estimation display, but required by type
        correct: 1014,
        tolerance: 50,
        explanation: 'A Kékes 1014 méter magas.'
      },
      {
        id: 'm7_img',
        category: 'mixed',
        difficulty: 'hard',
        type: 'image',
        question: 'Melyik város látható a képen?',
        answers: ['Pécs', 'Eger', 'Debrecen', 'Sopron'],
        correct: 1,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Eger_minaret.jpg/800px-Eger_minaret.jpg',
        explanation: 'Ez az egri minaret.'
      },
      q('m8', 'mixed', 'easy', 'Hány lakosa van Budapestnek (millióban)?', ['1.2', '1.7', '2.1', '2.5'], 1),
      q('m9', 'mixed', 'hard', 'Melyik magyar találmány a hologram?', ['Igaz', 'Hamis', 'Részben', 'Vitatott'], 0),
      q('m10', 'mixed', 'medium', 'Ki volt Semmelweis Ignác?', ['Sebész', 'Szülész', 'Fogorvos', 'Szemész'], 1),
      q('m11', 'mixed', 'easy', 'Mi a Balaton mélysége átlagosan?', ['1-2 m', '3-4 m', '5-6 m', '7-8 m'], 1),
      q('m12', 'mixed', 'hard', 'Melyik évben nyerte az első magyar az Oscar-díjat?', ['1938', '1948', '1958', '1968'], 0),
      q('m13', 'mixed', 'medium', 'Ki találta fel a színes TV-t?', ['Goldmark Péter', 'Gábor Dénes', 'Teller Ede', 'Wigner Jenő'], 0),
      q('m14', 'mixed', 'easy', 'Mi a hungarikum?', ['Védett magyar érték', 'Történelmi emlék', 'Nemzeti ünnep', 'Művészeti ág'], 0),
      q('m15', 'mixed', 'hard', 'Hány világörökségi helyszín van Magyarországon?', ['6', '8', '10', '12'], 1),
      q('m16', 'mixed', 'medium', 'Ki volt Liszt Ferenc?', ['Író', 'Festő', 'Zeneszerző', 'Tudós'], 2),
      q('m17', 'mixed', 'easy', 'Mi Magyarország hivatalos nyelve?', ['Angol', 'Német', 'Magyar', 'Latin'], 2),
      q('m18', 'mixed', 'hard', 'Melyik évben volt a millenneumi ünnepség?', ['1886', '1896', '1906', '1916'], 1),
      q('m19', 'mixed', 'medium', 'Ki építette a Lánchidat?', ['Ybl Miklós', 'Clark Ádám', 'Steindl Imre', 'Pollack Mihály'], 1),
      q('m20', 'mixed', 'easy', 'Mi az Országház stílusa?', ['Barokk', 'Klasszicista', 'Neogótikus', 'Modern'], 2),
    ]
  }
];

export function getAllQuestions(): { question: Question; category: Category; isBonus: boolean }[] {
  const allQuestions: { question: Question; category: Category; isBonus: boolean }[] = [];

  for (const category of categories) {
    for (const question of category.questions) {
      allQuestions.push({
        question,
        category,
        isBonus: category.isBonus || false
      });
    }
  }

  return allQuestions;
}

export function getQuestionsByCategory(categoryId: CategoryType): Question[] {
  const category = categories.find(c => c.id === categoryId);
  return category?.questions || [];
}

export function getRandomCategories(count: number, exclude?: CategoryType[]): CategoryType[] {
  const available = categories
    .filter(c => !exclude?.includes(c.id))
    .map(c => c.id);

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
