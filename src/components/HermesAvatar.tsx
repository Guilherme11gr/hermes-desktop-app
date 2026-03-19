import React, { useEffect, useState } from 'react';

type AvatarState = 'idle' | 'thinking' | 'streaming' | 'error' | 'happy' | 'confused';

interface HermesMiniAvatarProps {
  state?: AvatarState;
  className?: string;
  showStatus?: boolean; // Show random status message below avatar
}

// ===========================================
// MASSIVE KAOMOJI COLLECTION
// ===========================================

const KAOMOJI: Record<AvatarState, { frames: string[]; speed: number }> = {
  // IDLE - Calm, peaceful, occasionally blinking
  idle: {
    frames: [
      '(◕‿◕)',
      '(◕‿◕)',
      '(◕‿◕)',
      '(−‿−)',  // blink
      '(◕‿◕)',
      '(◕‿◕)',
      '(•‿•)',   // slight smile variation
      '(◕‿◕)',
      '(◕‿◕)',
      '(◠‿◠)',   // closed eyes smile
      '(◕‿◕)',
      '(◕‿◕)',
      '(−‿−)',   // blink again
      '(◕‿◕)',
      '(◕‿◕)',
      '(◕ᴗ◕)',   // happy glint
      '(◕‿◕)',
      '(◕‿◕)',
      '(◕‿◕)',
      'ʕ•ᴥ•ʔ',   // occasional bear mode
      '(◕‿◕)',
      '(◕‿◕)',
      '(◠‿◠✿)',  // flower moment
      '(◕‿◕)',
      '(◕‿◕)',
      '(・ω・)',  // cat face
      '(◕‿◕)',
      '(◕‿◕)',
      '(◡‿◡)',   // soft smile
      '(◕‿◕)',
      // Easter eggs (raros)
      '( ˘ω˘ )',  // sleepy
      '(｡◕‿◕｡)',  // extra cute
      '٩(◕‿◕)۶',  // yay arms
    ],
    speed: 1500, // 1.5s - nice and chill
  },

  // THINKING - Puzzled, processing, curious
  thinking: {
    frames: [
      '(◔_◔)',
      '(◔.◔)',
      '(◔_◔)',
      '(◔‸◔)',   // skeptical
      '(◔_◔)',
      '(•̀_•́)',   // focused
      '(◔_◔)',
      '(・_・)',   // neutral thinking
      '(◔_◔)',
      '(◉_◉)',   // wide eyes
      '(◔_◔)',
      '(◐_◐)',   // left looking
      '(◔_◔)',
      '(◑_◑)',   // right looking
      '(◔_◔)',
      '(˘_˘)',   // sleepy thinking
      '(◔_◔)',
      '(°_°)',   // surprised thinking
      '(◔_◔)',
      '(◉_◉)',
      '(◔_◔)',
      '(・・;)',  // sweat drop
      '(◔_◔)',
      '(・・)',   // hmm
      '(◔_◔)',
      '(・ε・)',  // hmm interesting
      '(◔_◔)',
      '(・_・;)',  // nervous
      '(◔_◔)',
      '(￣～￣)',  // sleepy
      '(◔_◔)',
      // Easter eggs
      '( ͡° ͜ʖ ͡°)',  // lenny
      '(╭ರ_⊙)',    // suspicious
      '(꒪꒳꒪)',    // really?
      '(≖_≖ )',    // judging
    ],
    speed: 1000, // 1s - thoughtful pace
  },

  // STREAMING - Excited, happy, engaged!
  streaming: {
    frames: [
      '(★‿★)',
      '(✧ω✧)',
      '(★‿★)',
      '(✧◡✧)',
      '(★‿★)',
      '(≧◡≦)',   // super happy
      '(★‿★)',
      '(✧▽✧)',
      '(★‿★)',
      '(⌒‿⌒)',   // big smile
      '(★‿★)',
      '(✧ω✧)',
      '(★‿★)',
      '(◕‿<)',   // wink
      '(★‿★)',
      '(✧ᴖ✧)',   // sparkly
      '(★‿★)',
      '(◠▽◠)',   // big happy
      '(★‿★)',
      '(✧◡✧)',
      '(★‿★)',
      '(◕▿◕)',   // open mouth happy
      '(★‿★)',
      '(≧▿≦)',   // very excited
      '(★‿★)',
      'ヽ(★‿★)ノ',  // arms up!
      '(★‿★)',
      '(✧▽✧)',
      '(★‿★)',
      '(✧≧◡≦✧)',  // extra sparkly
      '(★‿★)',
      // Easter eggs
      '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',  // magic sparkles
      'ヽ(>∀<☆)ノ',     // party
      '(づ￣ ³￣)づ',    // hug
      '(ღ˘⌣˘ღ)',       // love
      '٩(๑>◡<๑)۶',     // super happy
    ],
    speed: 800, // 800ms - lively but chill
  },

  // ERROR - Confused, surprised, oops
  error: {
    frames: [
      '(°□°)',
      '(°△°)',
      '(°□°)',
      '(◉△◉)',   // wide
      '(°□°)',
      '(；°△°)',  // sweat
      '(°□°)',
      '(◎_◎;)',  // dizzy
      '(°□°)',
      '(°◇°)',   // diamond surprise
      '(°□°)',
      '(°□°)',
      '(×_×)',   // dead
      '(°□°)',
      '(×_×;)',  // dead sweat
      '(°□°)',
      '(>_<)',   // squeezing
      '(°□°)',
      '(>△<)',   // squeeze wide
      '(°□°)',
      '(Ò_Ó)',   // angry confusion
      '(°□°)',
      '(∘_∘)',   // hollow
      '(°□°)',
      '(°□° )',  // leaning
      '(°□°)',
      // Easter eggs
      '(╯°□°)╯︵ ┻━┻',  // table flip!
      '┻━┻ ︵ ヽ(°□°)ノ)',  // flipped table
      '(ノಠ益ಠ)ノ彡┻━┻',  // angry flip
      '(ಥ﹏ಥ)',  // crying
      '(ノ_<。)',  // sob
    ],
    speed: 900, // 900ms - confused wobble
  },

  // HAPPY - Extra happy moments
  happy: {
    frames: [
      '(◕‿◕)',
      '(◠‿◠)',
      '(◕‿◕)',
      '(≧◡≦)',
      '(◕‿◕)',
      '(⌒‿⌒)',
      '(◕‿◕)',
      '(◕▿◕)',
      '(◕‿◕)',
      '٩(◕‿◕)۶',  // yay arms
      '(◕‿◕)',
      '(◠▽◠)',
      '(◕‿◕)',
      '✧(◕‿◕)✧',  // sparkles
      '(◕‿◕)',
    ],
    speed: 1200,
  },

  // CONFUSED - Lost, uncertain
  confused: {
    frames: [
      '(・_・;)',
      '(・・;)',
      '(・_・;)',
      '(;・_・)',
      '(・・;)',
      '(・﹏・)',  // worried
      '(・・;)',
      '(・◇・)',  // diamond confusion
      '(・・;)',
      '(・ω・)',  // hmm
      '(・・;)',
      '(・ε・*)', // hmm with blush
      '(・・;)',
      '(・_・?)', // question
      '(・・;)',
    ],
    speed: 1100,
  },
};

// ===========================================
// FUN STATUS MESSAGES (like Hermes CLI!)
// ===========================================

const STATUS_MESSAGES: Record<AvatarState, string[]> = {
  idle: [
    'pronto',
    'aguardando',
    'à disposição',
    'no aguardo',
    'ouvindo...',
  ],
  thinking: [
    'pensando...',
    'processando...',
    'analisando...',
    'refletindo...',
    'concatenando ideias...',
    'formulando resposta...',
    'carregando neurônios...',
    'invocando sabedoria...',
    'consultando oráculos...',
    'compilando pensamentos...',
    'destrinchando conceitos...',
    'amassando conexões...',
    'fermentando ideias...',
    'moendo neurônios...',
    'botando a manteiga na torrada...',
    'chamando os ancestrais...',
    'sacrificando bugs...',
    'invocando o Stack Overflow...',
    'pensando em Cafézinho...',
    'filosofando com o universo...',
    'conversando com a IA interior...',
    'debugando a realidade...',
    'hacking the mainframe...',
    'consultando as estrelas...',
    'meditando em clone...',
    'processando em paralelo...',
    'orquestrando sinapses...',
    'calibrando os transformers...',
    // Easter eggs (raros - só aparecem às vezes)
    '🤫 shh... segredo...',
    '☕ precisava de café...',
    '🎵 hummm de thinking...',
  ],
  streaming: [
    'respondendo...',
    'digitando...',
    'escrevendo...',
    'codificando...',
    'transmitindo...',
    'despejando sabedoria...',
    'fazendo mágica...',
    'gerando brilho...',
    'craftando palavras...',
    'entregando o ouro...',
    'manifestando resposta...',
    'materializando pensamentos...',
    'cozinhando a resposta...',
    'servindo conhecimento...',
    'regando o jardim das ideias...',
    'espalhando bits...',
    'costurando tokens...',
    'embaralhando embeddings...',
    'navegando no espaço latente...',
    'decodificando a matrix...',
    'traduzindo do neuronês...',
    'sincronizando com o cosmos...',
    'canalizando a inteligência...',
    'vazando sabedoria...',
    'derramando tokens...',
    // Easter eggs
    '⚡ modo turbo ativado!',
    '🔥 tá quente demais!',
    '✨ sparkle sparkle!',
    '🚀 zoom zoom!',
  ],
  error: [
    'eita!',
    'oops...',
    'droga!',
    'aff...',
    'deu ruim...',
    'algo deu errado...',
    'não foi dessa vez...',
    'vish, peraí...',
    'recarrega que eu viro...',
    'barril!',
    'xabu!',
    'ferrou...',
    'eita preula!',
    'vixi maria!',
    // Easter eggs
    '🎮 perdeu uma vida!',
    '💥 BOOM!',
    '🔥 tá pegando fogo!',
    '🤖 beedoop boop erro!',
  ],
  happy: [
    'show!',
    'massa!',
    'mandou bem!',
    'é isso aí!',
    'arrasou!',
    'perfeito!',
    'top demais!',
    'sinistro!',
    // Easter eggs
    '🎉 confetti!',
    '🏆 venceu!',
    '⭐ 5 estrelas!',
  ],
  confused: [
    'hmm...',
    'estranho...',
    'não entendi...',
    'como assim?',
    'ué...',
    'quê?',
    'blz?',
    // Easter eggs
    '🤔 hmmmm...',
    '👀 olha só...',
    '🦆 quack?',
  ],
};

// Hook to get random cycling status message
export const useRandomStatus = (state: AvatarState, isActive: boolean): string => {
  const [message, setMessage] = useState(STATUS_MESSAGES[state][0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setMessage(STATUS_MESSAGES[state][0]);
      return;
    }

    const messages = STATUS_MESSAGES[state];
    
    // Change message every 2-4 seconds randomly
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * messages.length);
      setMessageIndex(randomIndex);
      setMessage(messages[randomIndex]);
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [state, isActive]);

  return message;
};

// Simple text-only component for inline status
export const RandomStatusText: React.FC<{ state: AvatarState }> = ({ state }) => {
  const isActive = state === 'thinking' || state === 'streaming';
  const message = useRandomStatus(state, isActive);
  return <>{message}</>;
};

export const HermesMiniAvatar: React.FC<HermesMiniAvatarProps> = ({
  state = 'idle',
  className = '',
  showStatus = false
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [currentState, setCurrentState] = useState<AvatarState>(state);
  
  // Get random status message (cycling every 2-4s)
  const isActive = state === 'thinking' || state === 'streaming';
  const statusMessage = useRandomStatus(currentState, isActive);

  // Reset frame when state changes
  useEffect(() => {
    setCurrentState(state);
    setFrameIndex(0);
  }, [state]);

  // Animation loop
  useEffect(() => {
    const { frames, speed } = KAOMOJI[currentState];

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [currentState]);

  const getColorClass = () => {
    switch (currentState) {
      case 'streaming':
        return 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]';
      case 'thinking':
        return 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]';
      case 'error':
        return 'text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.3)]';
      case 'happy':
        return 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.3)]';
      case 'confused':
        return 'text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.3)]';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusColorClass = () => {
    switch (currentState) {
      case 'streaming':
        return 'text-green-500/70';
      case 'thinking':
        return 'text-blue-500/70';
      case 'error':
        return 'text-red-500/70';
      default:
        return 'text-gray-500/70';
    }
  };

  const currentEmoji = KAOMOJI[currentState].frames[frameIndex];

  if (showStatus) {
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        <span
          className={`
            font-mono text-sm
            transition-all duration-500 ease-out
            select-none
            ${getColorClass()}
          `}
          role="img"
          aria-label={`Hermes - ${currentState}`}
        >
          {currentEmoji}
        </span>
        <span
          className={`
            text-xs font-mono
            transition-all duration-300
            animate-pulse
            ${getStatusColorClass()}
          `}
        >
          {statusMessage}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`
        font-mono text-sm
        transition-all duration-500 ease-out
        select-none
        ${getColorClass()}
        ${className}
      `}
      role="img"
      aria-label={`Hermes - ${currentState}`}
    >
      {currentEmoji}
    </span>
  );
};

// Hook for avatar state based on app state
export const useAvatarState = (
  isLoading: boolean,
  isStreaming: boolean,
  hasError: boolean
): AvatarState => {
  if (hasError) return 'error';
  if (isStreaming) return 'streaming';
  if (isLoading) return 'thinking';
  return 'idle';
};

// Export state type
export type { AvatarState };
