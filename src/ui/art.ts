export const icons: Record<string, string> = {
  lantern:
    '<path d="M9 7V5a3 3 0 0 1 6 0v2M6 8h12l-2 13H8L6 8ZM5 8h14M9 21h6M12 11v6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  settings:
    '<path d="m10 3-.6 2-2 .9-1.9-.5-2 3.4L5 10.5v3l-1.5 1.7 2 3.4 1.9-.5 2 .9.6 2h4l.6-2 2-.9 1.9.5 2-3.4-1.5-1.7v-3l1.5-1.7-2-3.4-1.9.5-2-.9-.6-2Z"/><circle cx="12" cy="12" r="3"/>',
  sound:
    '<path d="m11 4-5 4H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-5 4H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
  trophy:
    '<path d="M8 3h8v5a4 4 0 0 1-8 0V3ZM8 4H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v7m-4 2h8"/>',
  leaf: '<path d="M20 3C7 2 2 8 5 15s13 7 15-12ZM5 20 16 8M9 15v-5m0 5h5"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
};
export const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.star}</svg>`;
/** Original vector storybook illustration; deliberately contains no maze map. */
export function forestArt(): string {
  return `<svg class="forest-art" viewBox="0 0 600 620" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="300" y1="0" x2="300" y2="620" gradientUnits="userSpaceOnUse"><stop stop-color="#213e42"/><stop offset="1" stop-color="#48694f"/></linearGradient>
    <radialGradient id="mist"><stop stop-color="#a0b69b" stop-opacity=".65"/><stop offset="1" stop-color="#688f7b" stop-opacity="0"/></radialGradient>
    <radialGradient id="lamplight"><stop stop-color="#ffe2a0" stop-opacity=".7"/><stop offset=".4" stop-color="#e9bb60" stop-opacity=".25"/><stop offset="1" stop-color="#efc76b" stop-opacity="0"/></radialGradient>
    <linearGradient id="trail" x1="300" y1="300" x2="300" y2="620" gradientUnits="userSpaceOnUse"><stop stop-color="#83927a"/><stop offset="1" stop-color="#b0b390"/></linearGradient>
    <clipPath id="forest-clip"><path d="M20 600V270C20 120 127 16 300 16S580 120 580 270v330Z"/></clipPath>
  </defs>
  <g clip-path="url(#forest-clip)">
  <path fill="url(#sky)" d="M0 0h600v620H0z"/>
  <circle cx="376" cy="127" r="38" fill="#f3dfab"/><circle cx="389" cy="113" r="34" fill="#29474a"/>
  <ellipse cx="305" cy="320" rx="220" ry="260" fill="url(#mist)"/>
  <g fill="#31544d"><path d="m103 63-65 252h130ZM191 110l-57 228h114ZM475 98l-78 256h156ZM341 180l-50 157h100Z"/></g>
  <g stroke="#3b5d50" stroke-width="13"><path d="M198 159v227m265-241v249M95 153v244m238-183v159"/></g>
  <path d="M0 371Q133 298 299 355T600 339v281H0" fill="#3f604c"/>
  <path d="M424 330c-66 32-144 22-109 79 25 41-174 64-159 211h335c-13-75-199-119-145-169 45-42 72-60 78-121Z" fill="url(#trail)"/>
  <g transform="translate(403 269)"><path d="M-28 32h67v61h-67Z" fill="#d8b37b"/><path d="m-39 34 44-47 46 47Z" fill="#916d57"/><path d="m-43 35 47-51 50 51" stroke="#b7996c" stroke-width="6"/><path d="M-2 92V62a11 11 0 0 1 22 0v30" fill="#715344"/><rect x="-19" y="49" width="14" height="15" rx="2" fill="#ffe2a0"/><path d="M-12 49v15m-7-8h14" stroke="#b18d5a" stroke-width="2"/><path d="M27 2v-29h12V16" fill="#8c715d"/><path d="M33-42c-17-14 15-16 0-31" stroke="#a8b4a1" stroke-width="6" stroke-linecap="round" opacity=".4"/></g>
  <g fill="#24443e"><path d="M0 100q56 80 37 245t44 275H0Z"/><path d="M580 69q-51 147-32 278t-37 273h89V0Z"/><path d="M74 0q10 80-5 155L32 295l-11-22L50 148 31 0Z"/><path d="M538 0q-40 111-18 262l48 63 9-17-38-69q-14-124 25-239Z"/>
  <ellipse cx="31" cy="69" rx="100" ry="92"/><ellipse cx="103" cy="18" rx="105" ry="76"/><ellipse cx="568" cy="91" rx="91" ry="113"/><ellipse cx="496" cy="6" rx="87" ry="68"/></g>
  <g fill="#325442"><ellipse cx="53" cy="458" rx="92" ry="61"/><ellipse cx="574" cy="457" rx="99" ry="68"/><ellipse cx="55" cy="553" rx="135" ry="72"/><ellipse cx="556" cy="588" rx="140" ry="67"/></g>
  <g stroke="#638361" stroke-width="3" stroke-linecap="round"><path d="m98 518-7-64m5 43-20-15m19 4 16-19M492 507l15-71m-8 45 24-15m-20-3-10-17M132 582l-6-49m4 27 13-14M475 587l7-35"/></g>
  <g fill="#7c9a70"><ellipse cx="77" cy="480" rx="11" ry="5" transform="rotate(25 77 480)"/><ellipse cx="109" cy="466" rx="6" ry="12" transform="rotate(35 109 466)"/><ellipse cx="523" cy="464" rx="12" ry="5" transform="rotate(-25 523 464)"/><ellipse cx="493" cy="444" rx="5" ry="12" transform="rotate(-25 493 444)"/></g>
  <ellipse cx="294" cy="505" rx="64" ry="14" fill="#395347" opacity=".4"/>
  <circle cx="339" cy="434" r="114" fill="url(#lamplight)"/>
  <g transform="translate(273 376)">
  <path d="M-24 100-28 125q10 7 20-1l5-26M13 99l2 25q14 10 21 0L27 96" fill="#4b3c36"/>
  <path d="m-23 36-20 62q41 22 81-1L24 36" fill="#c88665"/><path d="M-24 37q24 11 48 0l5 26q-32 17-60-2Z" fill="#e4a581"/>
  <path d="M-24 47-45 74q-4 8 4 10 6 1 10-7l19-19M23 50l25 18 18-13" stroke="#ebc19b" stroke-width="12" stroke-linecap="round"/>
  <path d="M-26 4q-12-39 19-44 41-7 42 35l-5 43q-13 4-18-10H-8q-12 18-26 8Z" fill="#463a35"/>
  <ellipse cx="1" cy="0" rx="26" ry="31" fill="#f3d1ae"/><path d="M-27-7q-4-36 27-34 33 1 35 39Q17-4 8-21-1-9-27-7Z" fill="#493a32"/>
  <path d="M-12-34q16-14 34-2" stroke="#d5a36c" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="-9" cy="2" rx="2" ry="3" fill="#4b3c36"/><ellipse cx="12" cy="2" rx="2" ry="3" fill="#4b3c36"/><path d="M-2 14q4 4 8 0" stroke="#a97561" stroke-width="2" stroke-linecap="round"/><circle cx="-17" cy="11" r="5" fill="#dfa68f" opacity=".65"/><circle cx="20" cy="11" r="5" fill="#dfa68f" opacity=".65"/>
  <g transform="translate(65 56)"><path d="M-6 5V-5a7 7 0 0 1 14 0V5" stroke="#6a533b" stroke-width="3"/><path d="m-13 6 3 31h23l3-31Z" fill="#f7ce78" stroke="#88663e" stroke-width="3"/><path d="M-15 5h32M-10 38h24" stroke="#88663e" stroke-width="5" stroke-linecap="round"/><path d="M1 8v25" stroke="#fff1be" stroke-width="5"/><path d="m-9 23 22-1" stroke="#b88b4a" stroke-width="2"/></g>
  </g>
  <g fill="#f3d58e"><circle cx="190" cy="315" r="2"/><circle cx="151" cy="402" r="3"/><circle cx="370" cy="379" r="2.5"/><circle cx="456" cy="212" r="2"/><circle cx="220" cy="185" r="2"/><circle cx="489" cy="388" r="2"/><circle cx="361" cy="532" r="2"/></g>
  <g fill="#bd8564"><path d="M125 543q11-23 24 0Z"/><path d="M464 527q13-22 23 0Z"/></g><g stroke="#d7c1a0" stroke-width="4"><path d="M136 542v12m340-28v12"/></g>
  </g>
  <path d="M20 600V270C20 120 127 16 300 16S580 120 580 270v330" stroke="#a7b7a1" stroke-width="1"/>
  <path d="M7 590V266C7 109 123 3 300 3s293 106 293 263v324" stroke="#b9c2ac" stroke-width="1" stroke-dasharray="2 7"/>
  </svg>`;
}
export function chapterArt(n: number): string {
  const colors = [
    "#9caf93",
    "#9caf93",
    "#a6b6a3",
    "#a7b8bb",
    "#a4b295",
    "#acada0",
    "#aeb8a0",
    "#9eafb0",
    "#b5aa92",
    "#b9ae95",
  ];
  return `<svg class="chapter-art" viewBox="0 0 170 94" aria-hidden="true"><ellipse cx="85" cy="81" rx="66" ry="8" fill="${colors[n - 1]}" opacity=".25"/><circle cx="${n % 2 ? 112 : 65}" cy="28" r="18" fill="#e8cb8c" opacity=".5"/>
  <g fill="${colors[n - 1]}"><path d="m34 17-22 56h44ZM59 5 34 71h50ZM125 13l-23 60h46Z"/></g><g fill="#536f5b"><path d="m38 30-16 43h33Zm93-4-19 47h37Z"/></g><g stroke="#6c7e63" stroke-width="2"><path d="M59 51v29m66-27v28M34 59v22"/></g><path d="M71 83q-15-15 11-21t6-23" stroke="#d2bb91" stroke-width="5" stroke-linecap="round"/><g fill="#d2af68"><circle cx="93" cy="30" r="2"/><circle cx="105" cy="56" r="1.5"/></g></svg>`;
}
