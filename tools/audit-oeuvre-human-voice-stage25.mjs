import fs from 'node:fs';

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const count = (text, value) => text.split(value).length - 1;

assert(!fs.existsSync('.human-voice'), 'orphan .human-voice migration directory must not exist');

const contracts = {
  'about/index.html': {
    required: [
      'Some moments change the reason you work.',
      'A serious accident forced me to stop and ask what photography was for. I realised that a well-made image was not enough. The work had to matter to the person in front of the camera as well. That decision still shapes my portraits and long-term projects.',
      'New York taught me something different. I arrived with little money and a clear idea. People helped, doors opened and the project moved forward one conversation at a time. Since then I have relied on preparation, human connection and the willingness to begin before every detail is settled.'
    ],
    forbidden: [
      'Some turns change more than the route.',
      'A serious accident forced me to stop and ask what I wanted photography to be for. I decided that a picture should do more than look good. It should carry meaning for the person who trusted me to make it. That decision still guides both portraits and long-term projects.',
      'New York taught me the next lesson. I arrived with very little money and a large idea. People helped, doors opened and the project found its way forward. Since then I have trusted careful preparation, human connection and the courage to begin before every answer is available.'
    ]
  },
  'hu/eletmu/index.html': {
    required: [
      'Egy súlyos baleset megállított, és rákényszerített, hogy feltegyem a kérdést: mire való számomra a fotográfia? Arra jutottam, hogy egy jól elkészített kép önmagában kevés. A munkának annak is jelentenie kell valamit, aki a kamera előtt áll. Ez a döntés ma is meghatározza a portréimat és a hosszabb projektjeimet.',
      'New York másfajta leckét adott. Kevés pénzzel, de világos elképzeléssel érkeztem. Emberek segítettek, ajtók nyíltak ki, a projekt pedig beszélgetésről beszélgetésre haladt előre. Azóta az alapos felkészülésre, az emberi kapcsolatokra és arra a bátorságra támaszkodom, amely akkor is elindít, amikor még nincs minden részlet a helyén.',
      'Az alábbi válogatás röviden mutatja be a fontosabb projekteket. A címek a művészeti archívum részletes forrásoldalaira vezetnek.'
    ],
    forbidden: [
      'Egy súlyos baleset megállított, és arra kényszerített, hogy megkérdezzem: mire szeretném használni a fotográfiát? Arra jutottam, hogy egy képnek a jó megjelenésnél többet kell adnia. Jelentenie kell valamit annak is, aki bizalmat adott hozzá. Ez a döntés ma is vezeti a portrékat és a hosszabb projekteket.',
      'New York adta a következő leckét. Kevés pénzzel és egy nagy ötlettel érkeztem. Emberek segítettek, ajtók nyíltak ki, a projekt pedig lépésről lépésre utat talált magának. Azóta hiszek az alapos felkészülésben, az emberi kapcsolatokban és abban a bátorságban, amely akkor is elindít, ha még nincs minden kérdésre válasz.',
      'Az alábbi lista tömör kurátori térkép. Minden projekt a művészeti archívumban található teljes forrásoldalra vezet.'
    ]
  },
  'de-at/werk/index.html': {
    required: [
      'Manche Momente verändern den Grund, warum man arbeitet.',
      'Ein schwerer Unfall zwang mich zu einer Pause und zu der Frage, wofür Fotografie für mich da ist. Mir wurde klar, dass ein gut gemachtes Bild allein nicht genügt. Die Arbeit muss auch für den Menschen vor der Kamera Bedeutung haben. Diese Entscheidung prägt bis heute meine Porträts und langfristigen Projekte.'
    ],
    forbidden: [
      'Manche Wendungen ändern mehr als nur die Richtung.',
      'Ein schwerer Unfall zwang mich zu einer Pause und zu der Frage, wofür ich Fotografie einsetzen möchte. Ich entschied, dass ein Bild mehr leisten soll als gut auszusehen. Es soll auch für den Menschen Bedeutung haben, der mir dafür Vertrauen schenkt. Diese Entscheidung prägt bis heute Porträts und langfristige Projekte.'
    ]
  }
};

for (const [file, contract] of Object.entries(contracts)) {
  const html = read(file);
  for (const phrase of contract.required) {
    assert(count(html, phrase) === 1, `${file}: reviewed phrase must occur exactly once: ${phrase.slice(0, 72)}`);
  }
  for (const phrase of contract.forbidden) {
    assert(!html.includes(phrase), `${file}: superseded phrase must not remain: ${phrase.slice(0, 72)}`);
  }
}

if (failures.length) {
  console.error(`Stage 25 oeuvre human-voice audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Stage 25 oeuvre human-voice cleanup audit passed.');
