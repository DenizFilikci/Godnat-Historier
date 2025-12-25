
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Story, StoryCharacter, AdvancedStoryParams } from './types';
import { generateScaryStory, continueScaryStoryWithChoice, speakStory, extendScaryStory, startAmbientHorror } from './services/geminiService';

const SPOOKY_AD_TEXTS = [
  "ET SYN FRA DEN ANDEN SIDE",
  "MØRKETS BUDSKAB",
  "FRAGMENT AF ET MARERIDT",
  "ADVARSEL FRA SKYGGERNE",
  "EN FORSTYRRELSE I VIRKELIGHEDEN",
  "DE PRØVER AT KONTAKTE DIG"
];

const SCENARIOS = [
  {
    id: 'farm',
    title: "Sulten på Gården",
    description: "Du arbejder alene på en afsides gård. Grisene har ikke spist i dagevis, og deres øjne er holdt op med at se menneskelige ud.",
    prompt: "En landbrugsmedarbejder alene på en gård, hvor grisene opfører sig unaturligt aggressivt og sultent, som om de venter på at han falder."
  },
  {
    id: 'sprogo',
    title: "Skyggerne på Sprogø",
    description: "Året er 1930. Du er indespærret på kvindehjemmet på Sprogø. Men det er ikke lægerne, du skal være mest bange for om natten.",
    prompt: "En gyserhistorie om en kvinde indespærret på det historiske kvindehjem på Sprogø, hvor mørke eksperimenter og genfærd hærger gangene."
  },
  {
    id: 'danskebank',
    title: "Gældens Pris",
    description: "Du arbejder sent i Danske Bank. Systemet viser lån, der aldrig burde være oprettet, og kunderne kræver mere end blot deres penge tilbage.",
    prompt: "Corporate horror i Danske Bank, hvor gældssvindel bliver til en overnaturlig forbandelse, og de snydte kunder hjemsøger hovedkontoret."
  },
  {
    id: 'riget',
    title: "Etage 0 på Riget",
    description: "En glemt elevator-knap på Rigshospitalet fører dig til en etage, der ikke burde eksistere. Patienterne her har ingen navne.",
    prompt: "En natportier på Rigshospitalet der finder en hemmelig etage fyldt med mørke medicinske hemmeligheder og levende døde."
  },
  {
    id: 'dba',
    title: "Købt på DBA",
    description: "Du købte et antikt spejl billigt på Den Blå Avis. Men hver gang du blinker, står refleksionen i spejlet en smule anderledes.",
    prompt: "En person køber en forbandet genstand på DBA, der begynder at overtage deres liv og manipulere deres virkelighed."
  },
  {
    id: 'vesterhavet',
    title: "Vesterhavets Tåge",
    description: "Når tågen ruller ind over Hvide Sande, kommer de druknede fiskere op fra dybet for at finde varme i de levendes huse.",
    prompt: "En kold gyser om havets genfærd der hjemsøger en lille dansk kystby under en tæt havgus."
  },
  {
    id: 'metro',
    title: "Den Glemte Perron",
    description: "Københavns Metro stopper ved en station, der ikke findes på kortet. Dørene åbner, men ingen stiger ud.",
    prompt: "En passager der ender på en glemt, mørk metrostation under København, hvor de underjordiske væsner lever af folks minder."
  },
  {
    id: 'skov',
    title: "Rold Skovs Hemmelighed",
    description: "Du er faret vild i Rold Skov. Træerne flytter sig, når du kigger væk, og en fløjten lyder fra dybet.",
    prompt: "Overnaturlig gyser i Rold Skov, hvor de gamle træer fanger vandrere i en uendelig tidslomme."
  }
];

// Tematisk AdUnit med Google AdSense integration og visuel lyn-effekt
const AdUnit: React.FC<{ slot?: string; className?: string; orientation?: 'horizontal' | 'vertical' }> = ({ slot, className, orientation = 'horizontal' }) => {
  const [caption, setCaption] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const [shouldRenderIns, setShouldRenderIns] = useState(false);
  const flashIntervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const adInited = useRef(false);

  useEffect(() => {
    setCaption(SPOOKY_AD_TEXTS[Math.floor(Math.random() * SPOOKY_AD_TEXTS.length)]);
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 10) {
          setShouldRenderIns(true);
          observer.disconnect();
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    flashIntervalRef.current = window.setInterval(() => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 40);
      setTimeout(() => setIsFlashing(true), 110);
      setTimeout(() => setIsFlashing(false), 220);
    }, 2000);

    return () => {
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (shouldRenderIns && !adInited.current) {
      requestAnimationFrame(() => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInited.current = true;
        } catch (e) {
          console.error("AdSense push failed:", e);
        }
      });
    }
  }, [shouldRenderIns, slot]);

  const isVertical = orientation === 'vertical';

  return (
    <div ref={containerRef} className={`adsense-wrapper relative overflow-hidden rounded-xl border border-red-900/20 bg-black/80 p-4 transition-all duration-700 hover:border-red-600/50 shadow-[0_0_20px_rgba(153,27,27,0.1)] group ${className} ${isVertical ? 'h-full flex flex-col min-w-[160px]' : 'my-10 min-h-[120px]'}`}>
      <div className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-75 mix-blend-screen ${isFlashing ? 'bg-blue-100/60 opacity-100 shadow-[inset_0_0_120px_rgba(255,255,255,0.9)]' : 'opacity-0'}`} />
      <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse pointer-events-none" />
      <div className={`flex items-center justify-between mb-4 px-1 ${isVertical ? 'flex-col gap-2 items-start' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-red-600 animate-ping"></div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-600/70 italic drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">{caption}</p>
        </div>
        <div className="text-[7px] font-bold text-white/10 tracking-widest">{isVertical ? 'SIDEBAR: LIVE' : 'SIGNAL: KORRUPT'}</div>
      </div>
      <div className={`relative z-10 bg-black/40 rounded-lg overflow-hidden border border-white/5 ${isVertical ? 'flex-1 min-h-[400px]' : 'min-h-[100px]'}`}>
        {shouldRenderIns && (
          <ins className="adsbygoogle"
               style={{ display: 'block', height: '100%', width: '100%' }}
               data-ad-client="ca-pub-2451374090541637"
               data-ad-slot={slot || "7439201584"}
               data-ad-format={isVertical ? 'vertical' : 'auto'}
               data-full-width-responsive="true"></ins>
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent bg-[length:100%_4px] animate-[scanline_10s_linear_infinite] opacity-30"></div>
      </div>
      <div className={`mt-2 flex justify-end ${isVertical ? 'mt-4' : ''}`}>
        <p className="text-[6px] font-black uppercase text-white/5 tracking-[0.5em]">Annonce</p>
      </div>
      <style>{`@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`}</style>
    </div>
  );
};

const RANDOM_TOPICS = [
  "En lydfil der ikke kan slettes",
  "Når ens egen skygge begynder at handle uafhængigt",
  "En forladt metro-station hvor togene kører baglæns",
  "At opdage at alle i byen er skiftet ud med kopier",
  "Et ansigt der langsomt vokser ud af skærmen"
];

const GENDER_OPTIONS = ['dreng', 'pige', 'mand', 'kvinde', 'andet'] as const;

interface CookiePreferences {
  necessary: boolean;
  marketing: boolean;
}

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [extensionPrompt, setExtensionPrompt] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ambientStarted, setAmbientStarted] = useState(false);
  const [showScare, setShowScare] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const [advLocation, setAdvLocation] = useState('');
  const [advYear, setAdvYear] = useState('');
  const [characters, setCharacters] = useState<StoryCharacter[]>([
    { name: '', age: 20, gender: 'mand' }
  ]);
  
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences | null>(null);
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const jumpScareTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedPrefs = localStorage.getItem('cookie_contract_v1');
    if (savedPrefs) {
      setCookiePrefs(JSON.parse(savedPrefs));
    } else {
      setShowCookieBanner(true);
    }

    const savedStoriesData = localStorage.getItem('godnat_historier_v1');
    if (savedStoriesData) {
      try { setSavedStories(JSON.parse(savedStoriesData)); } catch (e) {}
    }

    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('story');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(sharedData)));
        setCurrentStory(decoded);
      } catch (e) {}
    }

    return () => {
      if (jumpScareTimerRef.current) window.clearTimeout(jumpScareTimerRef.current);
    };
  }, []);

  const saveCookieChoices = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_contract_v1', JSON.stringify(prefs));
    setCookiePrefs(prefs);
    setShowCookieBanner(false);
  };

  useEffect(() => {
    if (currentStory && appState !== AppState.GENERATING) {
      startJumpScareCycle();
    } else {
      if (jumpScareTimerRef.current) window.clearTimeout(jumpScareTimerRef.current);
    }
  }, [currentStory, appState]);

  const startJumpScareCycle = () => {
    if (jumpScareTimerRef.current) window.clearTimeout(jumpScareTimerRef.current);
    const nextTime = 18000 + Math.random() * 12000;
    jumpScareTimerRef.current = window.setTimeout(() => {
      setShowScare(true);
      setTimeout(() => {
        setShowScare(false);
        startJumpScareCycle();
      }, 120);
    }, nextTime);
  };

  const ensureAmbient = () => {
    if (!ambientStarted) {
      startAmbientHorror();
      setAmbientStarted(true);
    }
  };

  const handleAddCharacter = () => {
    setCharacters([...characters, { name: '', age: 20, gender: 'mand' }]);
  };

  const handleRemoveCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const updateCharacter = (index: number, field: keyof StoryCharacter, value: any) => {
    const newChars = [...characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setCharacters(newChars);
  };

  const handleGenerate = async (e?: React.FormEvent, overrideTopic?: string) => {
    if (e) e.preventDefault();
    ensureAmbient();
    const finalTopic = overrideTopic || topic;
    if (!finalTopic.trim()) return;

    setAppState(AppState.GENERATING);
    setError(null);
    setFeedback(null);
    setCurrentStory(null);
    stopAudio();

    try {
      const advancedParams: AdvancedStoryParams | undefined = isAdvanced ? {
        location: advLocation,
        year: advYear,
        characters: characters.filter(c => c.name.trim() !== '')
      } : undefined;

      const result = await generateScaryStory(finalTopic, advancedParams);
      const newStory: Story = {
        title: result.title || 'Mørkets ekko',
        content: result.content || '',
        topic: finalTopic,
        timestamp: Date.now(),
        sources: result.sources,
        choices: result.choices,
        isFinished: result.isFinished
      };
      setCurrentStory(newStory);
      setAppState(AppState.IDLE);
      setTimeout(() => {
        const el = document.getElementById('story-content');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("Mørket vandt... prøv igen.");
      setAppState(AppState.IDLE);
    }
  };

  const handleChoice = async (choice: string) => {
    if (!currentStory || appState === AppState.GENERATING) return;
    ensureAmbient();
    setAppState(AppState.GENERATING);
    stopAudio();

    try {
      const result = await continueScaryStoryWithChoice(currentStory, choice);
      setCurrentStory({
        ...currentStory,
        content: currentStory.content + "\n\n" + result.content,
        choices: result.choices,
        isFinished: result.isFinished,
        timestamp: Date.now()
      });
      setAppState(AppState.IDLE);
      setTimeout(() => {
        const choicesEl = document.getElementById('story-choices');
        if (choicesEl) {
          choicesEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 150);
    } catch (err) {
      setError("Skæbnen blev for mørk...");
      setAppState(AppState.IDLE);
    }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    ensureAmbient();
    if (!currentStory || !extensionPrompt.trim()) return;

    setAppState(AppState.GENERATING);
    try {
      const updatedContent = await extendScaryStory(currentStory, extensionPrompt);
      setCurrentStory({ ...currentStory, content: updatedContent, timestamp: Date.now() });
      setExtensionPrompt('');
      setAppState(AppState.IDLE);
    } catch (err) {
      setError("Kunne ikke fortsætte...");
      setAppState(AppState.IDLE);
    }
  };

  const handleSurpriseMe = () => {
    ensureAmbient();
    const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setTopic(randomTopic);
    handleGenerate(undefined, randomTopic);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (appState === AppState.READING) setAppState(AppState.IDLE);
  };

  const handleReadAloud = async () => {
    ensureAmbient();
    if (!currentStory) return;
    setAppState(AppState.READING);
    try {
      await speakStory(currentStory.content, (source) => {
        audioSourceRef.current = source;
        source.onended = () => setAppState(AppState.IDLE);
      });
    } catch (err) {
      setAppState(AppState.IDLE);
    }
  };

  const handleSave = () => {
    if (!currentStory) return;
    const exists = savedStories.some(s => s.timestamp === currentStory.timestamp);
    if (!exists) {
      const newSaved = [currentStory, ...savedStories].slice(0, 10);
      setSavedStories(newSaved);
      localStorage.setItem('godnat_historier_v1', JSON.stringify(newSaved));
      setFeedback("Gemt i mørket.");
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleShare = async () => {
    if (!currentStory) return;
    try {
      const storyData = btoa(JSON.stringify(currentStory));
      const shareUrl = `${window.location.origin}${window.location.pathname}?story=${encodeURIComponent(storyData)}`;
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Link kopieret.");
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {}
  };

  const renderStoryContent = (content: string) => {
    const parts = content.split(/("[^"]*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="italic text-red-400/90 drop-shadow-[0_0_2px_rgba(255,0,0,0.3)]">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`min-h-screen relative flex flex-col items-center p-4 lg:p-6 pb-24 transition-all duration-300 ${appState === AppState.GENERATING || showScare ? 'glitch-active' : ''}`}>
      
      {showCookieBanner && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="glass max-w-md w-full p-8 rounded-3xl border-red-900/40 shadow-[0_0_50px_rgba(255,0,0,0.15)] space-y-6">
            <h2 className="font-spooky text-3xl text-red-600 text-center uppercase tracking-widest">Kontrakten med Skyggerne</h2>
            {!showCookieSettings ? (
              <>
                <p className="text-white/70 text-sm leading-relaxed text-center font-medium">For at kunne navigere i mørket og vise dig de rette syner, har vi brug for at placere små fragmenter (cookies) på din enhed. Er du klar til at indgå pagten?</p>
                <div className="space-y-3">
                  <button onClick={() => saveCookieChoices({ necessary: true, marketing: true })} className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(185,28,28,0.4)]">Acceptér Pagten</button>
                  <button onClick={() => setShowCookieSettings(true)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest border border-white/10">Vælg dine ofre</button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-bold text-xs uppercase tracking-tighter">Nødvendige fragmenter</p>
                      <p className="text-white/40 text-[9px]">Gør det muligt at gemme dine historier.</p>
                    </div>
                    <div className="text-red-500 text-[10px] font-black uppercase">Obligatorisk</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-bold text-xs uppercase tracking-tighter">Markedsføring (Reklamer)</p>
                      <p className="text-white/40 text-[9px]">Gør det muligt at vise reklamer.</p>
                    </div>
                    <input type="checkbox" id="marketing-check" className="accent-red-600 w-4 h-4" defaultChecked={true} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCookieSettings(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest">Tilbage</button>
                  <button onClick={() => {
                    const isMarketing = (document.getElementById('marketing-check') as HTMLInputElement).checked;
                    saveCookieChoices({ necessary: true, marketing: isMarketing });
                  }} className="flex-1 bg-red-700 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_10px_rgba(185,28,28,0.3)]">Gem Valg</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showScare && (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center overflow-hidden">
          <h2 className="font-spooky text-9xl text-white mix-blend-difference rotate-12 scale-150">SE MIG</h2>
        </div>
      )}

      <header className="relative z-10 text-center mb-16 mt-12 px-4">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-spooky text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] mb-2 animate-pulse break-words max-w-4xl mx-auto">Godnat Historier</h1>
        <p className="text-white font-black tracking-[0.4em] uppercase text-[10px] md:text-xs opacity-50">Sov aldrig igen</p>
      </header>

      <div className="w-full max-w-[1400px] flex gap-8 items-start justify-center">
        <aside className="hidden xl:block w-[200px] sticky top-8 h-[calc(100vh-100px)]">
          <AdUnit orientation="vertical" slot="sidebar_left_id" className="h-full" />
        </aside>

        <main className="relative z-20 w-full max-w-xl space-y-12">
          <section className="glass rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-red-500 text-[10px] font-black uppercase tracking-widest">Hvad skal rædslen handle om?</label>
              <button onClick={() => setIsAdvanced(!isAdvanced)} className="text-white/40 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1">{isAdvanced ? '← Hurtig' : 'Avanceret ⚒'}</button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-4">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="F.eks. Skriget fra kælderen..." className="w-full bg-black/60 border-b-2 border-red-900 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-all text-lg font-bold" />
                {isAdvanced && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Lokation</label>
                        <input type="text" value={advLocation} onChange={(e) => setAdvLocation(e.target.value)} placeholder="Lokation" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Årstal</label>
                        <input type="text" value={advYear} onChange={(e) => setAdvYear(e.target.value)} placeholder="Årstal" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Karakterer</label>
                        <button type="button" onClick={handleAddCharacter} className="text-[9px] bg-red-900/30 text-red-500 px-2 py-1 rounded-md hover:bg-red-900/50">+ Tilføj</button>
                      </div>
                      {characters.map((char, index) => (
                        <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 relative group">
                          <button type="button" onClick={() => handleRemoveCharacter(index)} className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="Navn" value={char.name} onChange={(e) => updateCharacter(index, 'name', e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs col-span-1" />
                            <input type="text" inputMode="numeric" placeholder="Alder" value={char.age === 0 ? '' : char.age} onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              updateCharacter(index, 'age', val ? parseInt(val) : 0);
                            }} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                            <select value={char.gender} onChange={(e) => updateCharacter(index, 'gender', e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-white text-[10px] uppercase font-bold">
                              {GENDER_OPTIONS.map(g => (<option key={g} value={g}>{g}</option>))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-5 rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(185,28,28,0.4)]" disabled={appState === AppState.GENERATING}>{appState === AppState.GENERATING ? "SKRIVER..." : "START MARERIDTET"}</button>
                {!isAdvanced && (<button type="button" onClick={handleSurpriseMe} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all text-xs uppercase tracking-widest border border-white/10">OVERRASK MIG</button>)}
              </div>
            </form>
          </section>

          {appState === AppState.IDLE && !currentStory && (
             <AdUnit slot="forside_slot_id" className="animate-in fade-in duration-1000 slide-in-from-bottom-4" />
          )}

          {(error || feedback) && (
            <div className="bg-red-600/20 border border-red-600 px-6 py-4 rounded-xl text-center font-black text-xs uppercase tracking-widest text-red-200">{error || feedback}</div>
          )}

          {appState === AppState.GENERATING && (
            <div className="space-y-6 animate-pulse">
              <p className="text-center text-xs font-black uppercase tracking-[0.4em] text-red-900">Ofret bliver forberedt...</p>
              <AdUnit slot="loading_slot_id" className="border-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.3)]" />
            </div>
          )}

          {currentStory && (
            <article id="story-content" className="glass rounded-3xl p-6 md:p-12 space-y-10 animate-in fade-in zoom-in duration-500">
              <div className="space-y-4 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-red-600 tracking-tighter leading-none italic uppercase">{currentStory.title}</h2>
                <div className="flex justify-center gap-2">
                  <button onClick={appState === AppState.READING ? stopAudio : handleReadAloud} className="px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg hover:scale-105 transition-all shadow-lg">{appState === AppState.READING ? 'STOP' : 'LYT'}</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase rounded-lg hover:bg-white/20 transition-all">GEM</button>
                  <button onClick={handleShare} className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase rounded-lg">DEL</button>
                </div>
              </div>
              <div className="text-xl md:text-2xl font-medium text-slate-100 leading-tight space-y-8 whitespace-pre-wrap tracking-tight border-l-2 border-red-900/30 pl-6">{renderStoryContent(currentStory.content)}</div>
              <AdUnit slot="story_mid_slot_id" />
              {!currentStory.isFinished && currentStory.choices && currentStory.choices.length > 0 && (
                <div id="story-choices" className="pt-12 border-t border-white/10 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="flex flex-col items-center gap-4">
                     <div className="h-px w-24 bg-red-600/50"></div>
                     <p className="text-center font-black text-[11px] text-red-600 uppercase tracking-[0.6em] animate-pulse">DIT VALG ER AFGØRENDE</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentStory.choices.map((choice, idx) => (
                      <button key={idx} disabled={appState === AppState.GENERATING} onClick={() => handleChoice(choice)} className="group relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-red-600/50 p-6 md:p-8 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] text-left shadow-xl">
                        <div className="relative z-10 flex flex-col gap-3">
                          <span className="text-red-900 font-black text-[9px] uppercase tracking-[0.3em]">SKÆBNEVEJ {idx + 1}</span>
                          <span className="text-white text-base md:text-lg font-bold leading-relaxed group-hover:text-red-500 transition-colors drop-shadow-sm">{choice}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/[0.02] group-hover:to-red-600/[0.08] transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {currentStory.isFinished && (
                <div className="text-center pt-12 border-t border-white/5">
                  <p className="font-spooky text-3xl text-white/20 tracking-widest">SLUT</p>
                  <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mt-2">Mørket har vundet... for denne gang.</p>
                </div>
              )}
              <form onSubmit={handleExtend} className="pt-12 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center">TVING HISTORIEN I DIN RETNING</p>
                <div className="flex gap-2">
                  <input type="text" value={extensionPrompt} onChange={(e) => setExtensionPrompt(e.target.value)} placeholder="Skriv din egen drejning..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-red-900 transition-all" />
                  <button type="submit" disabled={appState === AppState.GENERATING} className="bg-red-800 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg active:scale-95 disabled:opacity-30">{appState === AppState.GENERATING ? "..." : "SEND"}</button>
                </div>
              </form>
            </article>
          )}

          {/* New Scenarios Section */}
          <section className="pt-24 space-y-12">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-900/50"></div>
              <p className="font-black text-[12px] uppercase tracking-[0.6em] text-red-600 italic">Scenarier fra Mørket</p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-900/50"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleGenerate(undefined, scenario.prompt)}
                  disabled={appState === AppState.GENERATING}
                  className="group relative glass p-6 rounded-2xl text-left border-white/5 hover:border-red-600/40 hover:bg-red-900/[0.05] transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <span className="font-spooky text-4xl text-red-600">?</span>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="font-black text-xs uppercase tracking-widest text-red-500 group-hover:text-red-400 transition-colors">{scenario.title}</h3>
                    <p className="text-[10px] text-white/50 leading-relaxed group-hover:text-white/80 transition-colors italic">{scenario.description}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-red-900/20 group-hover:bg-red-600/40 transition-all"></div>
                </button>
              ))}
            </div>
          </section>

          {savedStories.length > 0 && (
            <section className="pt-24 opacity-20 hover:opacity-100 transition-all duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-white/10"></div>
                <p className="font-black text-[10px] uppercase tracking-[0.8em] text-white/40">ARKIVET</p>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {savedStories.map(s => (
                  <button key={s.timestamp} onClick={() => { setCurrentStory(s); stopAudio(); }} className="glass p-5 rounded-xl text-left border-white/5 hover:border-red-900/40 hover:bg-red-900/[0.02] transition-all flex justify-between items-center group">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-xs uppercase tracking-wider text-white/80 group-hover:text-white">{s.title}</span>
                      <span className="text-[8px] text-white/30 uppercase">{new Date(s.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[9px] opacity-0 group-hover:opacity-100 text-red-600 font-black tracking-widest transition-all translate-x-4 group-hover:translate-x-0">GENLÆS →</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="hidden xl:block w-[200px] sticky top-8 h-[calc(100vh-100px)]">
          <AdUnit orientation="vertical" slot="sidebar_right_id" className="h-full" />
        </aside>
      </div>

      <footer className="mt-32 py-10 text-white/10 text-[9px] font-black tracking-[1.5em] uppercase flex flex-col items-center gap-6">
        <span className="animate-pulse">DE SER DIG NU</span>
        <button onClick={() => setShowCookieBanner(true)} className="hover:text-red-600 transition-colors border-b border-transparent hover:border-red-600/40 pb-1 tracking-[0.5em] text-[8px]">OPDATER PAGTEN (COOKIES)</button>
      </footer>
    </div>
  );
};

export default App;
